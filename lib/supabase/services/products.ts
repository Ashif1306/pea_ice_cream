import { createClient } from "@/lib/supabase/client";
import { Product, DUMMY_PRODUCTS } from "@/lib/dummy-data";
import { CupSize } from "@/lib/constants";
import {
  adminSaveProductFlavorConfigs,
  fetchProductFlavorConfigs,
  ProductFlavorConfigItem,
} from "@/lib/supabase/services/flavors";

export async function fetchCatalogProducts(): Promise<Product[]> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/admin/products?availableOnly=true", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.products)) {
          return json.products;
        }
      }
    } catch (e) {
      console.warn("fetchCatalogProducts API fallback:", e);
    }
  }

  if (typeof window === "undefined") {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const file = path.default.join(process.cwd(), "data", "products.json");
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((p: Product) => p.isAvailable && !p.isArchived);
        }
      }
    } catch {}
  }

  const supabase = createClient();
  if (!supabase) {
    return [];
  }

  try {
    const { data: prods, error } = await supabase
      .from("products")
      .select(`
        *,
        flavors:product_flavors(*),
        sizes:product_sizes(*),
        inventory:inventory(*)
      `)
      .eq("is_available", true)
      .eq("is_archived", false)
      .order("created_at", { ascending: true });

    if (error || !prods || prods.length === 0) {
      return [];
    }

    return prods.map(mapDbProductToUi);
  } catch (e) {
    console.error("Gagal mengambil produk dari Supabase:", e);
    return [];
  }
}

export async function fetchProductById(id: string): Promise<Product | undefined> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.products)) {
          const found = json.products.find((p: Product) => p.id === id);
          if (found) return found;
        }
      }
    } catch {}
  }

  const supabase = createClient();
  let baseProd: Product | undefined;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          flavors:product_flavors(*),
          sizes:product_sizes(*),
          inventory:inventory(*)
        `)
        .eq("id", id)
        .single();

      if (!error && data) {
        baseProd = mapDbProductToUi(data);
      }
    } catch {
      // fallback
    }
  }

  if (!baseProd) {
    baseProd = DUMMY_PRODUCTS.find((p) => p.id === id);
  }

  if (baseProd) {
    // Enrich with latest product flavor configs from server API
    try {
      const configs = await fetchProductFlavorConfigs(id);
      if (configs && configs.length > 0) {
        baseProd.allowedFlavors = configs;
      }
    } catch {}
  }

  return baseProd;
}

export async function adminFetchAllProducts(): Promise<Product[]> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.products)) {
          return json.products;
        }
      }
    } catch (e) {
      console.warn("adminFetchAllProducts API fallback:", e);
    }
  }

  const supabase = createClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      flavors:product_flavors(*),
      sizes:product_sizes(*),
      inventory:inventory(*)
    `)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new Error(error?.message || "Gagal memuat produk dari database");
  }

  return data.map(mapDbProductToUi);
}

export async function adminArchiveProduct(id: string): Promise<void> {
  if (typeof window !== "undefined") {
    const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal mengarsipkan produk.");
    }
    return;
  }

  const supabase = createClient();
  if (!supabase) throw new Error("Supabase belum terhubung");

  // Soft delete: tandai is_archived = true agar riwayat pesanan tidak rusak
  const { error } = await supabase
    .from("products")
    .update({ is_archived: true, is_available: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function adminToggleProductAvailability(id: string, isAvailable: boolean): Promise<void> {
  if (typeof window !== "undefined") {
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isAvailable }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal update status ketersediaan.");
    }
    return;
  }

  const supabase = createClient();
  if (!supabase) throw new Error("Supabase belum terhubung");

  const { error } = await supabase
    .from("products")
    .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function adminSaveProduct(
  product: Partial<Product> & {
    name: string;
    category: any;
    categoryId?: string;
    sizes: any[];
    flavors: string[];
    isMixEnabled?: boolean;
    minFlavorCount?: number;
    maxFlavorCount?: number;
    hasFlavorSelection?: boolean;
    flavorChoiceLabel?: string;
    flavorChoiceCount?: number;
    allowSameFlavor?: boolean;
    allowedFlavors?: ProductFlavorConfigItem[];
  }
): Promise<string> {
  if (typeof window !== "undefined") {
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal menyimpan produk.");
    }
    return json.id || json.product.id;
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.id || "");
  const prodId = isUuid ? product.id! : crypto.randomUUID();

  const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const basePrice = product.basePrice !== undefined
    ? product.basePrice
    : Math.min(...product.sizes.map((s) => s.price || 15000));

  const isMix = product.isMixEnabled ?? product.hasFlavorSelection ?? false;
  const minFlavors = Math.max(1, product.minFlavorCount || 1);
  const maxFlavors = Math.max(minFlavors, product.maxFlavorCount || product.flavorChoiceCount || 2);

  const prodPayload: any = {
    id: prodId,
    name: product.name,
    slug,
    description: product.description || "",
    category_slug: product.category,
    allergens: product.allergens || [],
    images: product.images && product.images.length > 0 ? product.images : ["/placeholder-ice-cream.jpg"],
    is_available: product.isAvailable ?? true,
    is_bestseller: product.isBestseller ?? false,
    is_new: product.isNew ?? false,
    is_archived: false,
    base_price: basePrice,
    updated_at: new Date().toISOString(),
  };

  const supabase = createClient();
  if (supabase) {
    try {
      const { error: prodError } = await supabase.from("products").upsert(prodPayload);
      if (prodError) console.warn("Supabase product upsert warning:", prodError.message);

      // Upsert sizes
      for (const s of product.sizes) {
        await supabase.from("product_sizes").upsert({
          product_id: prodId,
          size: s.size,
          price: s.price,
          allow_mix_flavors: s.allowMixFlavors ?? (s.size !== "small"),
        }, { onConflict: "product_id,size" });
      }

      // Upsert legacy flavors
      for (let idx = 0; idx < product.flavors.length; idx++) {
        const fName = product.flavors[idx];
        const fSlug = fName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const { data: flavorData } = await supabase.from("product_flavors").upsert({
          product_id: prodId,
          name: fName,
          slug: fSlug,
          order_idx: idx + 1,
          is_active: true,
        }, { onConflict: "product_id,slug" }).select().single();

        if (flavorData) {
          for (const s of product.sizes) {
            await supabase.from("inventory").upsert({
              product_id: prodId,
              flavor_id: flavorData.id,
              size: s.size,
              quantity: product.stock?.[fSlug]?.[s.size as CupSize] ?? 20,
            }, { onConflict: "product_id,flavor_id,size" });
          }
        }
      }
    } catch (e: any) {
      console.warn("Supabase product save warning:", e.message);
    }
  }

  // Save allowed flavors configuration
  if (product.allowedFlavors) {
    await adminSaveProductFlavorConfigs(prodId, product.allowedFlavors);
  }

  return prodId;
}

function mapDbProductToUi(db: any): Product {
  const flavorsList = (db.flavors || []).map((f: any) => f.name);
  const sizesList = (db.sizes || []).map((s: any) => ({
    size: s.size as CupSize,
    price: s.price,
    allowMixFlavors: s.allow_mix_flavors,
  }));

  const stockMatrix: Record<string, Record<CupSize, number>> = {};
  for (const f of db.flavors || []) {
    const key = f.slug || f.name.toLowerCase().replace(/\s+/g, "-");
    stockMatrix[key] = {
      small: 0,
      medium: 0,
      large: 0,
    };
  }

  for (const inv of db.inventory || []) {
    const flavorObj = (db.flavors || []).find((f: any) => f.id === inv.flavor_id);
    const key = flavorObj?.slug || flavorObj?.name?.toLowerCase().replace(/\s+/g, "-");
    if (key && stockMatrix[key]) {
      stockMatrix[key][inv.size as CupSize] = inv.quantity;
    }
  }

  return {
    id: db.id,
    name: db.name,
    description: db.description,
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
    isBestseller: db.is_bestseller,
    isNew: db.is_new,
    isMixEnabled: db.is_mix_enabled ?? db.has_flavor_selection ?? false,
    minFlavorCount: db.min_flavor_count ?? 1,
    maxFlavorCount: db.max_flavor_count ?? db.flavor_choice_count ?? 2,
    hasFlavorSelection: db.has_flavor_selection ?? db.is_mix_enabled ?? false,
    flavorChoiceLabel: db.flavor_choice_label || "Rasa",
    flavorChoiceCount: db.max_flavor_count ?? db.flavor_choice_count ?? 2,
    allowSameFlavor: db.allow_same_flavor ?? false,
    allowedFlavors: (db.product_flavor_configs || []).map((fc: any) => ({
      id: fc.id,
      productId: fc.product_id,
      flavorId: fc.flavor_id,
      flavorName: fc.flavor?.name || "Rasa",
      flavorImageUrl: fc.flavor?.image_url,
      isFlavorAvailable: fc.flavor?.is_available !== false,
      extraPrice: fc.extra_price || 0,
      orderIdx: fc.order_idx || 1,
      isActive: fc.is_active !== false,
    })),
  };
}
