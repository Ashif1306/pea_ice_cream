export interface MasterFlavor {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  isAvailable: boolean;
  orderIdx: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFlavorConfigItem {
  id?: string;
  productId: string;
  flavorId: string;
  flavorName?: string;
  flavorImageUrl?: string;
  isFlavorAvailable?: boolean;
  extraPrice: number;
  orderIdx: number;
  isActive: boolean;
}

// ─── Local Storage Keys ───────────────────────────────────────────────────────
export const FLAVORS_STORAGE_KEY = "pea_master_flavors";
export const PROD_FLAVORS_STORAGE_KEY = "pea_prod_flavor_configs";

export function getStoredMasterFlavors(): MasterFlavor[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FLAVORS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.error("Gagal membaca master rasa dari localStorage:", e);
  }
  return [];
}

export function saveStoredMasterFlavors(flavors: MasterFlavor[], notify = true): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FLAVORS_STORAGE_KEY, JSON.stringify(flavors));
    if (notify) {
      window.dispatchEvent(new Event("pea_flavors_changed"));
    }
  } catch (e) {
    console.error("Gagal menyimpan master rasa ke localStorage:", e);
  }
}

// ─── Master Flavors API Functions ─────────────────────────────────────────────

export async function fetchActiveFlavors(): Promise<MasterFlavor[]> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/admin/flavors?activeOnly=true", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.flavors)) {
          return json.flavors;
        }
      }
    } catch {
      // fallback to localStorage
    }
    return getStoredMasterFlavors().filter((f) => f.isActive);
  }

  return [];
}

export async function adminFetchAllFlavors(): Promise<MasterFlavor[]> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/admin/flavors", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.flavors)) {
          saveStoredMasterFlavors(json.flavors, false);
          return json.flavors;
        }
      }
    } catch {
      // fallback
    }
    return getStoredMasterFlavors();
  }

  return [];
}

export async function adminSaveFlavor(flavor: Partial<MasterFlavor>): Promise<MasterFlavor> {
  const res = await fetch("/api/admin/flavors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(flavor),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Gagal menyimpan data rasa.");
  }

  // Update local storage
  const all = getStoredMasterFlavors();
  const exists = all.some((f) => f.id === json.flavor.id);
  const updated = exists
    ? all.map((f) => (f.id === json.flavor.id ? json.flavor : f))
    : [...all, json.flavor];
  saveStoredMasterFlavors(updated, true);

  return json.flavor;
}

export async function adminToggleFlavorAvailability(id: string, isAvailable: boolean): Promise<void> {
  const res = await fetch("/api/admin/flavors", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, isAvailable }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Gagal mengubah status ketersediaan rasa.");
  }

  const all = getStoredMasterFlavors();
  const updated = all.map((f) => (f.id === id ? { ...f, isAvailable } : f));
  saveStoredMasterFlavors(updated, true);
}

export async function adminArchiveFlavor(id: string): Promise<void> {
  const res = await fetch("/api/admin/flavors", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, isActive: false }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Gagal mengarsipkan rasa.");
  }

  const all = getStoredMasterFlavors();
  const updated = all.map((f) => (f.id === id ? { ...f, isActive: false } : f));
  saveStoredMasterFlavors(updated, true);
}

// ─── Product Flavor Configurations API ─────────────────────────────────────────

export async function fetchProductFlavorConfigs(productId: string): Promise<ProductFlavorConfigItem[]> {
  try {
    const res = await fetch(`/api/admin/product-flavors?productId=${productId}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.configs)) {
        return json.configs;
      }
    }
  } catch {
    // fallback
  }

  return [];
}

export async function adminSaveProductFlavorConfigs(
  productId: string,
  configs: ProductFlavorConfigItem[]
): Promise<void> {
  const res = await fetch("/api/admin/product-flavors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, configs }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Gagal menyimpan konfigurasi pilihan rasa produk.");
  }
}
