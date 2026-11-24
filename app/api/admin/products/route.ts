import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

const PRODUCTS_FILE = path.join(process.cwd(), "data", "products.json");
const FLAVOR_CONFIGS_FILE = path.join(process.cwd(), "data", "product-flavor-configs.json");

const SEED_PRODUCT_IDS = [
  "00000000-0000-0000-0000-000000000101",
  "00000000-0000-0000-0000-000000000102",
  "00000000-0000-0000-0000-000000000103",
  "00000000-0000-0000-0000-000000000104",
  "00000000-0000-0000-0000-000000000105",
  "00000000-0000-0000-0000-000000000106",
];

const isUuid = (id?: string | null): boolean =>
  typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

function readStoredProducts(): any[] {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const raw = fs.readFileSync(PRODUCTS_FILE, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (e) {
    console.error("Gagal membaca products.json:", e);
  }
  return [];
}

function writeStoredProducts(products: any[]): void {
  try {
    const dir = path.dirname(PRODUCTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8");
  } catch (e) {
    console.error("Gagal menyimpan products.json:", e);
  }
}

function readFlavorConfigs(): Record<string, any[]> {
  try {
    if (fs.existsSync(FLAVOR_CONFIGS_FILE)) {
      const raw = fs.readFileSync(FLAVOR_CONFIGS_FILE, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const map: Record<string, any[]> = {};
        for (const item of list) {
          if (!map[item.productId]) map[item.productId] = [];
          map[item.productId].push(item);
        }
        return map;
      }
    }
  } catch {}
  return {};
}

function mapDbProductToUi(db: any): any {
  const flavorsList = (db.flavors || []).map((f: any) => f.name);
  const sizesList = (db.sizes || []).map((s: any) => ({
    size: s.size,
    price: s.price,
    allowMixFlavors: s.allow_mix_flavors,
  }));

  const stockMatrix: Record<string, Record<string, number>> = {};
  for (const f of db.flavors || []) {
    const key = f.slug || f.name.toLowerCase().replace(/\s+/g, "-");
    stockMatrix[key] = { small: 0, medium: 0, large: 0 };
  }

  for (const inv of db.inventory || []) {
    const flavorObj = (db.flavors || []).find((f: any) => f.id === inv.flavor_id);
    const key = flavorObj?.slug || flavorObj?.name?.toLowerCase().replace(/\s+/g, "-");
    if (key && stockMatrix[key]) {
      stockMatrix[key][inv.size] = inv.quantity;
    }
  }

  return {
    id: db.id,
    name: db.name,
    description: db.description || "",
    flavors: flavorsList.length > 0 ? flavorsList : [db.name],
    sizes: sizesList.length > 0 ? sizesList : [
      { size: "small", price: db.base_price, allowMixFlavors: false },
      { size: "medium", price: db.base_price + 5000, allowMixFlavors: true },
      { size: "large", price: db.base_price + 10000, allowMixFlavors: true },
    ],
    basePrice: db.base_price,
    images: db.images && db.images.length > 0 ? db.images : ["/placeholder-ice-cream.jpg"],
    stock: stockMatrix,
    category: db.category_slug,
    categoryId: db.category_id || undefined,
    categoryName: db.category?.name || db.category_slug,
    allergens: db.allergens || [],
    isAvailable: db.is_available,
    isBestseller: db.is_bestseller || false,
    isNew: db.is_new || false,
    isArchived: db.is_archived || false,
    isMixEnabled: db.is_mix_enabled ?? false,
    minFlavorCount: db.min_flavor_count ?? 1,
    maxFlavorCount: db.max_flavor_count ?? 2,
    hasFlavorSelection: db.has_flavor_selection ?? false,
    flavorChoiceLabel: db.flavor_choice_label || "Rasa",
    flavorChoiceCount: db.flavor_choice_count ?? 2,
    allowSameFlavor: db.allow_same_flavor ?? false,
    allowedFlavors: [],
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const availableOnly = searchParams.get("availableOnly") === "true";

    const supabase = createClient();
    let products: any[] = [];

    if (supabase) {
      try {
        // 1. Purge seed products from Supabase
        await supabase.from("inventory").delete().in("product_id", SEED_PRODUCT_IDS);
        await supabase.from("product_sizes").delete().in("product_id", SEED_PRODUCT_IDS);
        await supabase.from("product_flavors").delete().in("product_id", SEED_PRODUCT_IDS);
        await supabase.from("products").delete().in("id", SEED_PRODUCT_IDS);

        // 2. Fetch real user products from Supabase
        const { data: dbData } = await supabase
          .from("products")
          .select(`
            *,
            flavors:product_flavors(*),
            sizes:product_sizes(*),
            inventory:inventory(*)
          `)
          .not("id", "in", `(${SEED_PRODUCT_IDS.join(",")})`)
          .eq("is_archived", false)
          .order("created_at", { ascending: false });

        if (dbData && dbData.length > 0) {
          const localList = readStoredProducts();
          const localMap = new Map(localList.map((p) => [p.id, p]));

          products = dbData.map((db) => {
            const ui = mapDbProductToUi(db);
            const cached = localMap.get(db.id);
            if (cached) {
              return { ...ui, ...cached, id: ui.id, isArchived: false };
            }
            return ui;
          });

          writeStoredProducts(products);
        } else {
          products = readStoredProducts().filter((p) => !SEED_PRODUCT_IDS.includes(p.id) && !p.isArchived);
        }
      } catch (e) {
        console.warn("Supabase GET error:", e);
        products = readStoredProducts().filter((p) => !SEED_PRODUCT_IDS.includes(p.id) && !p.isArchived);
      }
    } else {
      products = readStoredProducts().filter((p) => !SEED_PRODUCT_IDS.includes(p.id) && !p.isArchived);
    }

    // Attach allowedFlavors
    const flavorConfigs = readFlavorConfigs();
    for (const p of products) {
      if (!p.allowedFlavors || p.allowedFlavors.length === 0) {
        p.allowedFlavors = flavorConfigs[p.id] || [];
      }
    }

    let result = products.filter((p) => !p.isArchived && !SEED_PRODUCT_IDS.includes(p.id));

    if (availableOnly) {
      result = result.filter((p) => p.isAvailable);
    }

    return NextResponse.json({ success: true, products: result });
  } catch (err: any) {
    console.error("GET /api/admin/products error:", err);
    return NextResponse.json({ success: false, error: err.message, products: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const product = await request.json();

    if (!product.name || typeof product.name !== "string" || !product.name.trim()) {
      return NextResponse.json({ error: "Nama produk wajib diisi." }, { status: 400 });
    }

    const prodId = isUuid(product.id) ? product.id : crypto.randomUUID();
    const slug = product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const basePrice = product.basePrice !== undefined
      ? product.basePrice
      : Math.min(...(product.sizes || []).map((s: any) => s.price || 15000));

    const isMix = Boolean(product.isMixEnabled ?? product.hasFlavorSelection ?? false);
    const minFlavors = Math.max(1, Number(product.minFlavorCount) || 1);
    const maxFlavors = Math.max(minFlavors, Number(product.maxFlavorCount) || Number(product.flavorChoiceCount) || 2);

    const fullProduct = {
      ...product,
      id: prodId,
      name: product.name.trim(),
      slug,
      description: product.description || "",
      category: product.category,
      categoryId: product.categoryId || undefined,
      categoryName: product.categoryName || product.category,
      allergens: product.allergens || [],
      images: product.images && product.images.length > 0 ? product.images : ["/placeholder-ice-cream.jpg"],
      sizes: product.sizes || [
        { size: "small", price: basePrice, allowMixFlavors: false },
        { size: "medium", price: basePrice + 5000, allowMixFlavors: true },
        { size: "large", price: basePrice + 10000, allowMixFlavors: true },
      ],
      flavors: product.flavors && product.flavors.length > 0 ? product.flavors : [product.name.trim()],
      stock: product.stock || {},
      basePrice,
      isAvailable: product.isAvailable ?? true,
      isBestseller: Boolean(product.isBestseller),
      isNew: Boolean(product.isNew),
      isArchived: false,
      isMixEnabled: isMix,
      minFlavorCount: minFlavors,
      maxFlavorCount: maxFlavors,
      hasFlavorSelection: isMix,
      flavorChoiceLabel: product.flavorChoiceLabel || "Rasa",
      flavorChoiceCount: maxFlavors,
      allowSameFlavor: false,
      allowedFlavors: product.allowedFlavors || [],
      updatedAt: new Date().toISOString(),
    };

    // 1. Save to local products.json
    const all = readStoredProducts();
    const idx = all.findIndex((p) => p.id === prodId || (product.id && p.id === product.id));
    if (idx >= 0) {
      all[idx] = fullProduct;
    } else {
      all.unshift(fullProduct);
    }
    writeStoredProducts(all);

    // 2. Sync to Supabase
    const supabase = createClient();
    if (supabase) {
      try {
        const safePayload: any = {
          id: prodId,
          name: fullProduct.name,
          slug: fullProduct.slug,
          description: fullProduct.description,
          category_slug: fullProduct.category,
          allergens: fullProduct.allergens,
          images: fullProduct.images,
          is_available: fullProduct.isAvailable,
          is_bestseller: fullProduct.isBestseller,
          is_new: fullProduct.isNew,
          is_archived: false,
          base_price: fullProduct.basePrice,
          updated_at: new Date().toISOString(),
        };

        const { error: prodError } = await supabase.from("products").upsert(safePayload);
        if (prodError) console.warn("Supabase product upsert warning:", prodError.message);

        // Upsert sizes
        if (Array.isArray(fullProduct.sizes)) {
          for (const s of fullProduct.sizes) {
            await supabase.from("product_sizes").upsert({
              product_id: prodId,
              size: s.size,
              price: s.price,
              allow_mix_flavors: s.allowMixFlavors ?? (s.size !== "small"),
            }, { onConflict: "product_id,size" });
          }
        }
      } catch (e: any) {
        console.warn("Supabase sync warning in POST /api/admin/products:", e.message);
      }
    }

    return NextResponse.json({ success: true, product: fullProduct, id: prodId });
  } catch (err: any) {
    console.error("POST /api/admin/products error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, isAvailable } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID produk diperlukan." }, { status: 400 });
    }

    // 1. Update in local products.json
    const all = readStoredProducts();
    const target = all.find((p) => p.id === id);
    if (target) {
      target.isAvailable = Boolean(isAvailable);
      target.updatedAt = new Date().toISOString();
      writeStoredProducts(all);
    }

    // 2. Update in Supabase if valid UUID
    if (isUuid(id)) {
      const supabase = createClient();
      if (supabase) {
        try {
          await supabase
            .from("products")
            .update({ is_available: Boolean(isAvailable), updated_at: new Date().toISOString() })
            .eq("id", id);
        } catch (e: any) {
          console.warn("Supabase PATCH warning:", e.message);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID produk diperlukan." }, { status: 400 });
    }

    // 1. Mark archived in products.json (permanent local archive)
    const all = readStoredProducts();
    const updated = all.filter((p) => p.id !== id);
    writeStoredProducts(updated);

    // 2. Soft delete in Supabase if valid UUID
    if (isUuid(id)) {
      const supabase = createClient();
      if (supabase) {
        try {
          const { error } = await supabase
            .from("products")
            .update({ is_archived: true, is_available: false, updated_at: new Date().toISOString() })
            .eq("id", id);

          if (error) {
            console.warn("Supabase archive error:", error.message);
          }
        } catch (e: any) {
          console.warn("Supabase DELETE warning:", e.message);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Produk berhasil diarsipkan." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
