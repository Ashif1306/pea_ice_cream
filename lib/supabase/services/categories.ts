import { createClient } from "@/lib/supabase/client";

export interface ProductCategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  orderIdx: number;
  isActive: boolean;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const CATEGORIES_STORAGE_KEY = "pea_product_categories";

export function getStoredCategories(): ProductCategoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.error("Gagal membaca kategori dari localStorage:", e);
  }
  return [];
}

export function saveStoredCategories(categories: ProductCategoryItem[], notify = true): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    if (notify) {
      window.dispatchEvent(new Event("pea_categories_changed"));
    }
  } catch (e) {
    console.error("Gagal menyimpan kategori ke localStorage:", e);
  }
}

export async function fetchCategories(activeOnly = false): Promise<ProductCategoryItem[]> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/admin/categories?activeOnly=${activeOnly}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.categories)) {
          if (!activeOnly) {
            saveStoredCategories(json.categories, false);
          }
          return json.categories;
        }
      }
    } catch {
      // fallback
    }

    const local = getStoredCategories();
    return activeOnly ? local.filter((c) => c.isActive) : local;
  }

  if (typeof window === "undefined") {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const file = path.default.join(process.cwd(), "data", "categories.json");
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, "utf-8");
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          return activeOnly ? list.filter((c: any) => c.isActive) : list;
        }
      }
    } catch {}
  }

  // Server-side fetch from Supabase
  const supabase = createClient();
  if (supabase) {
    try {
      let query = supabase
        .from("product_categories")
        .select("*")
        .order("order_idx", { ascending: true });

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || "",
          orderIdx: c.order_idx || 1,
          isActive: c.is_active !== false,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
      }
    } catch (e) {
      console.error("Supabase fetchCategories error:", e);
    }
  }

  return [];
}

export async function adminSaveCategory(category: Partial<ProductCategoryItem>): Promise<ProductCategoryItem> {
  const res = await fetch("/api/admin/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(category),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Gagal menyimpan kategori.");
  }

  const all = getStoredCategories();
  const exists = all.some((c) => c.id === json.category.id);
  const updated = exists
    ? all.map((c) => (c.id === json.category.id ? json.category : c))
    : [...all, json.category];
  saveStoredCategories(updated, true);

  return json.category;
}

export async function adminToggleCategoryStatus(id: string, isActive: boolean): Promise<void> {
  const res = await fetch("/api/admin/categories", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, isActive }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Gagal mengubah status aktif kategori.");
  }

  const all = getStoredCategories();
  const updated = all.map((c) => (c.id === id ? { ...c, isActive } : c));
  saveStoredCategories(updated, true);
}

export async function adminDeleteCategory(id: string): Promise<void> {
  const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Gagal menghapus kategori.");
  }

  const all = getStoredCategories();
  const updated = all.filter((c) => c.id !== id);
  saveStoredCategories(updated, true);
}
