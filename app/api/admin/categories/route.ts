import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

const CATEGORIES_FILE = path.join(process.cwd(), "data", "categories.json");

const SEED_PRODUCT_IDS = [
  "00000000-0000-0000-0000-000000000101",
  "00000000-0000-0000-0000-000000000102",
  "00000000-0000-0000-0000-000000000103",
  "00000000-0000-0000-0000-000000000104",
  "00000000-0000-0000-0000-000000000105",
  "00000000-0000-0000-0000-000000000106",
];

function getFallbackCategories(): any[] {
  try {
    if (fs.existsSync(CATEGORIES_FILE)) {
      const raw = fs.readFileSync(CATEGORIES_FILE, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (e) {
    console.error("Gagal membaca categories.json:", e);
  }
  return [];
}

function saveFallbackCategories(categories: any[]): void {
  try {
    const dir = path.dirname(CATEGORIES_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2), "utf-8");
  } catch (e) {
    console.error("Gagal menyimpan categories.json:", e);
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const local = getFallbackCategories();
    const fallbackMap = new Map(local.map((f: any) => [f.id, f]));

    const supabase = createClient();
    if (!supabase) {
      const filtered = activeOnly ? local.filter((c) => c.isActive) : local;
      return NextResponse.json({ success: true, categories: filtered });
    }

    let query = supabase
      .from("product_categories")
      .select("*, products(id, is_archived)")
      .order("order_idx", { ascending: true })
      .order("name", { ascending: true });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error) {
      const filtered = activeOnly ? local.filter((c) => c.isActive) : local;
      return NextResponse.json({ success: true, categories: filtered });
    }

    const categories = (data || []).map((c: any) => {
      const nonArchivedProducts = Array.isArray(c.products)
        ? c.products.filter((p: any) => !p.is_archived && !SEED_PRODUCT_IDS.includes(p.id)).length
        : 0;
      const meta = fallbackMap.get(c.id) || {};

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || meta.description || "",
        orderIdx: c.order_idx || 1,
        isActive: c.is_active !== false,
        productCount: nonArchivedProducts,
        createdAt: c.created_at || meta.createdAt || new Date().toISOString(),
        updatedAt: c.updated_at || meta.updatedAt || new Date().toISOString(),
      };
    });

    // Sync fallback file
    saveFallbackCategories(categories);

    return NextResponse.json({ success: true, categories });
  } catch (err: any) {
    console.error("GET categories error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memuat kategori." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, slug, description, orderIdx, isActive } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nama kategori wajib diisi." }, { status: 400 });
    }

    const trimmedName = name.trim();
    let generatedSlug = slug && typeof slug === "string" && slug.trim()
      ? slugify(slug)
      : slugify(trimmedName);

    if (!generatedSlug) {
      generatedSlug = `kategori-${Date.now()}`;
    }

    const supabase = createClient();

    if (supabase) {
      // Check if updating existing category
      if (id) {
        // Keep slug unchanged if not explicitly provided, or verify uniqueness
        const { data: existing } = await supabase
          .from("product_categories")
          .select("id, slug")
          .eq("id", id)
          .single();

        if (existing) {
          // If slug changed, verify no conflict with another category
          if (slug && slugify(slug) !== existing.slug) {
            const { data: conflict } = await supabase
              .from("product_categories")
              .select("id")
              .eq("slug", slugify(slug))
              .neq("id", id)
              .maybeSingle();

            if (conflict) {
              generatedSlug = `${slugify(slug)}-${Date.now().toString().slice(-4)}`;
            } else {
              generatedSlug = slugify(slug);
            }
          } else {
            generatedSlug = existing.slug; // Preserve existing slug on rename!
          }

          // Only send guaranteed table columns to Supabase
          const { data: updated, error: updateError } = await supabase
            .from("product_categories")
            .update({
              name: trimmedName,
              slug: generatedSlug,
              order_idx: typeof orderIdx === "number" ? orderIdx : 1,
              is_active: isActive !== false,
            })
            .eq("id", id)
            .select()
            .single();

          if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 400 });
          }

          // Sync metadata to fallback file
          const all = getFallbackCategories();
          const existingIdx = all.findIndex((c) => c.id === id);
          const mapped = {
            id: updated.id,
            name: updated.name,
            slug: updated.slug,
            description: description !== undefined ? description.trim() : (existingIdx >= 0 ? all[existingIdx].description || "" : ""),
            orderIdx: updated.order_idx || 1,
            isActive: updated.is_active !== false,
            createdAt: existingIdx >= 0 ? all[existingIdx].createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          if (existingIdx >= 0) {
            all[existingIdx] = { ...all[existingIdx], ...mapped };
          } else {
            all.push(mapped);
          }
          saveFallbackCategories(all);

          return NextResponse.json({ success: true, category: mapped });
        }
      }

      // Insert new category
      // Check slug uniqueness
      const { data: conflict } = await supabase
        .from("product_categories")
        .select("id")
        .eq("slug", generatedSlug)
        .maybeSingle();

      if (conflict) {
        generatedSlug = `${generatedSlug}-${Date.now().toString().slice(-4)}`;
      }

      const newCatId = id || crypto.randomUUID();

      // Only send columns guaranteed to exist in Supabase table
      const { data: inserted, error: insertError } = await supabase
        .from("product_categories")
        .insert({
          id: newCatId,
          name: trimmedName,
          slug: generatedSlug,
          order_idx: typeof orderIdx === "number" ? orderIdx : 1,
          is_active: isActive !== false,
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 });
      }

      // Sync metadata to fallback file
      const all = getFallbackCategories();
      const mapped = {
        id: inserted.id,
        name: inserted.name,
        slug: inserted.slug,
        description: description ? description.trim() : "",
        orderIdx: inserted.order_idx || 1,
        isActive: inserted.is_active !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const existingIdx = all.findIndex((c) => c.id === mapped.id);
      if (existingIdx >= 0) {
        all[existingIdx] = mapped;
      } else {
        all.push(mapped);
      }
      saveFallbackCategories(all);

      return NextResponse.json({ success: true, category: mapped });
    }

    // Local file fallback
    const all = getFallbackCategories();
    const catId = id || crypto.randomUUID();
    const existingIdx = all.findIndex((c) => c.id === catId);

    const newCat = {
      id: catId,
      name: trimmedName,
      slug: generatedSlug,
      description: description ? description.trim() : "",
      orderIdx: typeof orderIdx === "number" ? orderIdx : 1,
      isActive: isActive !== false,
      productCount: 0,
      createdAt: existingIdx >= 0 ? all[existingIdx].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      all[existingIdx] = newCat;
    } else {
      all.push(newCat);
    }
    saveFallbackCategories(all);

    return NextResponse.json({ success: true, category: newCat });
  } catch (err: any) {
    console.error("POST category error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal menyimpan kategori." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID kategori diperlukan." }, { status: 400 });
    }

    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase
        .from("product_categories")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    const all = getFallbackCategories();
    const updated = all.map((c) => (c.id === id ? { ...c, isActive } : c));
    saveFallbackCategories(updated);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PATCH category error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal mengubah status kategori." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID kategori diperlukan." }, { status: 400 });
    }

    const supabase = createClient();
    if (supabase) {
      // 1. Get category info
      const { data: cat } = await supabase
        .from("product_categories")
        .select("id, slug, name")
        .eq("id", id)
        .single();

      if (cat) {
        // 2. Check if any REAL active/non-archived product uses this category
        const { data: realProducts } = await supabase
          .from("products")
          .select("id")
          .or(`category_id.eq.${id},category_slug.eq.${cat.slug}`)
          .not("id", "in", `(${SEED_PRODUCT_IDS.join(",")})`)
          .eq("is_archived", false);

        if (realProducts && realProducts.length > 0) {
          return NextResponse.json(
            {
              error: `Kategori "${cat.name}" masih berisi ${realProducts.length} produk. Pindahkan produk ke kategori lain atau nonaktifkan kategori ini terlebih dahulu sebelum menghapus.`,
            },
            { status: 400 }
          );
        }

        // 3. Clear any seed products or old unreferenced rows referencing this category so FK passes
        try {
          await supabase.from("inventory").delete().in("product_id", SEED_PRODUCT_IDS);
          await supabase.from("product_sizes").delete().in("product_id", SEED_PRODUCT_IDS);
          await supabase.from("product_flavors").delete().in("product_id", SEED_PRODUCT_IDS);
          await supabase.from("products").delete().eq("category_slug", cat.slug);
        } catch (e: any) {
          console.warn("Category delete FK cleanup warning:", e?.message);
        }

        // 4. Safe to delete the category
        const { error: delErr } = await supabase
          .from("product_categories")
          .delete()
          .eq("id", id);

        if (delErr) {
          return NextResponse.json({ error: delErr.message }, { status: 400 });
        }
      }
    }

    // Update local file fallback
    const all = getFallbackCategories();
    const filtered = all.filter((c) => c.id !== id);
    saveFallbackCategories(filtered);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE category error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal menghapus kategori." },
      { status: 500 }
    );
  }
}
