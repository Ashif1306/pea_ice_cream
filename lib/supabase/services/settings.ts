import { createClient } from "@/lib/supabase/client";

export interface StoreProfileData {
  businessName: string;
  tagline1: string;
  tagline2: string;
  tagline3: string;
  description: string;
  whatsappNumber: string;
  whatsappMessage?: string;
  instagram: string;
  tiktok?: string;
  email?: string;
  address: string;
  city: string;
  hours: string;
  logoUrl: string;
}

export const PROFILE_STORAGE_KEY = "pea_store_profile";

export const DEFAULT_STORE_PROFILE: StoreProfileData = {
  businessName: "Pea Ice Cream",
  tagline1: "ice cream classic",
  tagline2: "homemade ice cream",
  tagline3: "sehat tanpa pengawet",
  description: "Es krim artisan premium dengan cita rasa lokal dan internasional. Homemade ice cream Makassar.",
  whatsappNumber: "081234567890",
  whatsappMessage: "Halo Pea Ice Cream, saya ingin bertanya tentang menu es krim dan pemesanan.",
  instagram: "@pea.icecream",
  tiktok: "@pea.icecream",
  email: "peaicecream@gmail.com",
  address: "Jl. Sungai Kelara 38, Makassar",
  city: "Makassar, Sulawesi Selatan",
  hours: "Everyday 10.00 – 18.00 WITA (Main Store) • 10.00 – 22.00 WITA (Mall)",
  logoUrl: "/logo.jpg",
};

export function getWhatsAppLink(phone: string, message?: string): string {
  let cleaned = (phone || "").replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }
  const text = message?.trim() ? `?text=${encodeURIComponent(message.trim())}` : "";
  return `https://wa.me/${cleaned || "6281234567890"}${text}`;
}

export function getInstagramLink(handle: string): string {
  const clean = (handle || "").replace(/^@/, "").trim();
  return `https://instagram.com/${clean || "pea.icecream"}`;
}

export function getTikTokLink(handle: string): string {
  const clean = (handle || "").replace(/^@/, "").trim();
  return `https://tiktok.com/@${clean || "pea.icecream"}`;
}

export function getStoredStoreProfile(): StoreProfileData {
  if (typeof window === "undefined") return DEFAULT_STORE_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_STORE_PROFILE;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return { ...DEFAULT_STORE_PROFILE, ...parsed };
    }
  } catch (e) {
    console.error("Gagal membaca profil dari localStorage:", e);
  }
  return DEFAULT_STORE_PROFILE;
}

export function saveStoredStoreProfile(profile: StoreProfileData, notify = true): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    if (notify) {
      window.dispatchEvent(new Event("pea_profile_changed"));
    }
  } catch (e) {
    console.error("Gagal menyimpan profil ke localStorage:", e);
  }
}

let fetchProfilePromise: Promise<StoreProfileData> | null = null;

export async function fetchStoreProfile(): Promise<StoreProfileData> {
  if (typeof window !== "undefined") {
    const local = getStoredStoreProfile();

    if (!fetchProfilePromise) {
      fetchProfilePromise = (async () => {
        try {
          const res = await fetch("/api/admin/profile", { cache: "no-store" });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.profile) {
              const merged: StoreProfileData = { ...DEFAULT_STORE_PROFILE, ...json.profile };
              saveStoredStoreProfile(merged, false);
              return merged;
            }
          }
        } catch {
          // fallback to local
        } finally {
          setTimeout(() => {
            fetchProfilePromise = null;
          }, 3000);
        }
        return local;
      })();
    }
    return fetchProfilePromise;
  }
  return DEFAULT_STORE_PROFILE;
}

export async function adminSaveStoreProfile(profile: StoreProfileData): Promise<void> {
  // 1. Immediately save to localStorage and notify all listeners
  saveStoredStoreProfile(profile, true);

  // 2. Persist to server API (saves to data/store-profile.json & syncs to Supabase)
  try {
    await fetch("/api/admin/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
  } catch (err: any) {
    console.warn("Save store profile warning:", err.message);
  }

  // 3. Direct client Supabase fallback
  try {
    const supabase = createClient();
    if (supabase) {
      await supabase.from("store_settings").upsert({
        id: "00000000-0000-0000-0000-000000000001",
        business_name: profile.businessName,
        tagline_primary: `${profile.tagline1} • ${profile.tagline2}`,
        taglines: [profile.tagline1, profile.tagline2],
        pending_verification_tagline: profile.tagline3,
        description: profile.description,
        whatsapp_number: profile.whatsappNumber,
        instagram: profile.instagram,
        tiktok: profile.tiktok || "@pea.icecream",
        address: profile.address,
        city: profile.city,
        business_hours: profile.hours as any,
        logo_url: profile.logoUrl,
        is_active: true,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    console.warn("Client supabase store_settings upsert warning:", err.message);
  }
}

export async function fetchDeliveryZones(): Promise<any[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("delivery_zones")
    .select("*")
    .eq("is_active", true)
    .order("order_idx", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function adminSaveDeliveryZones(zones: any[]): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase belum terhubung");

  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(z.id || "");
    await supabase.from("delivery_zones").upsert({
      ...(isUuid ? { id: z.id } : {}),
      name: z.name,
      fee_range: z.feeRange || z.fee_range,
      notes: z.notes || "-",
      order_idx: i + 1,
      is_active: true,
    });
  }
}

export async function fetchPaymentMethods(): Promise<any[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("is_active", true)
    .order("order_idx", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function adminSavePaymentMethods(methods: any[]): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase belum terhubung");

  for (let i = 0; i < methods.length; i++) {
    const m = methods[i];
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.id || "");
    await supabase.from("payment_methods").upsert({
      ...(isUuid ? { id: m.id } : {}),
      type: m.type,
      bank_name: m.bank || m.bank_name || null,
      account_number: m.accountNumber || m.account_number || null,
      account_name: m.accountName || m.account_name || null,
      qris_image_url: m.qrisImageUrl || m.qris_image_url || null,
      instructions: m.instructions || null,
      order_idx: i + 1,
      is_active: true,
    });
  }
}

import { DEFAULT_PARTNER_APPS, DeliveryAppItem } from "@/lib/apps-data";

export const APPS_STORAGE_KEY = "pea_external_delivery_apps";

export function getStoredExternalApps(): DeliveryAppItem[] {
  if (typeof window === "undefined") return DEFAULT_PARTNER_APPS;
  try {
    const raw = localStorage.getItem(APPS_STORAGE_KEY);
    if (!raw) return DEFAULT_PARTNER_APPS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error("Gagal membaca data aplikasi dari localStorage:", e);
  }
  return DEFAULT_PARTNER_APPS;
}

export function saveStoredExternalApps(apps: DeliveryAppItem[], notify = true): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(apps));
    if (notify) {
      window.dispatchEvent(new Event("pea_apps_changed"));
    }
  } catch (e) {
    console.error("Gagal menyimpan data aplikasi ke localStorage:", e);
  }
}

let fetchAppsPromise: Promise<DeliveryAppItem[]> | null = null;

export async function fetchExternalApps(): Promise<DeliveryAppItem[]> {
  if (typeof window !== "undefined") {
    // 1. Read localStorage first for immediate synchronous display
    const local = getStoredExternalApps();

    // 2. Fetch from persistent server API with in-memory caching to avoid duplicate requests
    if (!fetchAppsPromise) {
      fetchAppsPromise = (async () => {
        try {
          const res = await fetch("/api/admin/external-apps", { cache: "no-store" });
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.apps) && json.apps.length > 0) {
              // Cache to localStorage silently WITHOUT dispatching event
              saveStoredExternalApps(json.apps, false);
              return json.apps;
            }
          }
        } catch {
          // Network fallback to localStorage
        } finally {
          setTimeout(() => {
            fetchAppsPromise = null;
          }, 3000); // 3-second cache window
        }
        return local;
      })();
    }

    return fetchAppsPromise;
  }

  return DEFAULT_PARTNER_APPS;
}

export async function adminSaveExternalApps(apps: any[]): Promise<void> {
  // 1. Save to localStorage and notify UI components
  saveStoredExternalApps(apps, true);

  // 2. Persist to server API (saves to data/external-apps.json & syncs to Supabase)
  try {
    await fetch("/api/admin/external-apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apps }),
    });
  } catch (err: any) {
    console.warn("Save external apps warning:", err.message);
  }
}
