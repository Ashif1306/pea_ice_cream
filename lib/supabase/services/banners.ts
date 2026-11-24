import { createClient } from "@/lib/supabase/client";
import {
  BannerSlide,
  INITIAL_BANNERS,
  CarouselAnimationSettings,
  getStoredBanners,
  saveStoredBanners,
  getStoredCarouselSettings,
  saveStoredCarouselSettings,
} from "@/lib/banners-data";

export async function fetchActiveBanners(): Promise<BannerSlide[]> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/admin/banners?activeOnly=true", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.banners) && json.banners.length > 0) {
          return json.banners;
        }
      }
    } catch (e) {
      console.warn("fetchActiveBanners API fallback:", e);
    }
    return getStoredBanners().filter((b) => b.isActive);
  }

  if (typeof window === "undefined") {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const file = path.default.join(process.cwd(), "data", "banners.json");
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, "utf-8");
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          return list.filter((b: any) => b.isActive);
        }
      }
    } catch {}
  }

  const supabase = createClient();
  if (!supabase) {
    return INITIAL_BANNERS;
  }

  try {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .order("order_idx", { ascending: true });

    if (error || !data || data.length === 0) {
      return INITIAL_BANNERS;
    }

    const mapped: BannerSlide[] = data.map((b) => {
      const img = b.product_cutout || b.image_desktop || b.image_mobile || "/cutouts/pea-cup-strawberry.svg";
      return {
        id: b.id,
        order: b.order_idx,
        isActive: b.is_active,
        title: b.title || "Kelembutan yang menyatu dengan manis yang pas.",
        subtitle: b.subtitle || "Sajian es krim dengan cita rasa seimbang yang selalu tepat dinikmati kapan saja.",
        ctaText: b.cta_text || "Pesan Sekarang",
        ctaLink: b.cta_link || "/katalog",
        badge: b.badge || "Pea Ice Cream",
        flavorLabel: b.flavor_label || "Pea Ice Cream",
        bgTheme: (b.bg_theme as any) || "pink",
        imageDesktop: img,
        imageMobile: b.image_mobile || img,
        imageAlt: b.image_alt || "Cup Es Krim Pea Ice Cream",
        productCutout: img,
      };
    });

    return mapped;
  } catch (e) {
    console.error("Gagal mengambil banner dari Supabase:", e);
    return INITIAL_BANNERS;
  }
}

export async function adminFetchAllBanners(): Promise<BannerSlide[]> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/admin/banners", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.banners) && json.banners.length > 0) {
          saveStoredBanners(json.banners);
          return json.banners;
        }
      }
    } catch (e) {
      console.warn("adminFetchAllBanners API fallback:", e);
    }
    return getStoredBanners();
  }

  const supabase = createClient();
  if (!supabase) {
    return INITIAL_BANNERS;
  }

  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("order_idx", { ascending: true });

  if (error || !data) {
    return INITIAL_BANNERS;
  }

  return data.map((b) => {
    const img = b.product_cutout || b.image_desktop || b.image_mobile || "/cutouts/pea-cup-strawberry.svg";
    return {
      id: b.id,
      order: b.order_idx,
      isActive: b.is_active,
      title: b.title || "Kelembutan yang menyatu dengan manis yang pas.",
      subtitle: b.subtitle || "Sajian es krim dengan cita rasa seimbang yang selalu tepat dinikmati kapan saja.",
      ctaText: b.cta_text || "Pesan Sekarang",
      ctaLink: b.cta_link || "/katalog",
      badge: b.badge || "Pea Ice Cream",
      flavorLabel: b.flavor_label || "Pea Ice Cream",
      bgTheme: b.bg_theme || "pink",
      imageDesktop: img,
      imageMobile: b.image_mobile || img,
      imageAlt: b.image_alt || "Banner Pea Ice Cream",
      productCutout: img,
    };
  });
}

export async function adminSaveBanner(banner: BannerSlide): Promise<void> {
  const res = await fetch("/api/admin/banners", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(banner),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Gagal menyimpan data banner.");
  }

  const all = getStoredBanners();
  const exists = all.some((b) => b.id === banner.id);
  const updated = exists
    ? all.map((b) => (b.id === banner.id ? json.banner : b))
    : [...all, json.banner];
  saveStoredBanners(updated);
}

export async function adminDeleteBanner(id: string): Promise<void> {
  const res = await fetch(`/api/admin/banners?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Gagal menghapus banner.");
  }

  const all = getStoredBanners();
  const updated = all.filter((b) => b.id !== id);
  saveStoredBanners(updated);
}

export async function adminUpdateBannerOrder(banners: BannerSlide[]): Promise<void> {
  const res = await fetch("/api/admin/banners", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ banners }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Gagal memperbarui urutan banner.");
  }

  saveStoredBanners(banners);
}

export async function fetchCarouselSettings(): Promise<CarouselAnimationSettings> {
  const fallback = getStoredCarouselSettings();
  const supabase = createClient();
  if (!supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select("carousel_autoplay, carousel_interval_seconds, carousel_transition_ms, carousel_bottom_effect")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      const retry = await supabase
        .from("store_settings")
        .select("carousel_autoplay, carousel_interval_seconds, carousel_transition_ms")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (!retry.data) return fallback;

      const loaded: CarouselAnimationSettings = {
        autoplay: retry.data.carousel_autoplay !== false,
        intervalSeconds: Math.min(20, Math.max(3, Number(retry.data.carousel_interval_seconds) || fallback.intervalSeconds)),
        transitionMs: Math.min(1500, Math.max(300, Number(retry.data.carousel_transition_ms) || fallback.transitionMs)),
        bottomEffect: fallback.bottomEffect || "melting-wave",
      };
      saveStoredCarouselSettings(loaded);
      return loaded;
    }

    const loaded: CarouselAnimationSettings = {
      autoplay: data.carousel_autoplay !== false,
      intervalSeconds: Math.min(20, Math.max(3, Number(data.carousel_interval_seconds) || fallback.intervalSeconds)),
      transitionMs: Math.min(1500, Math.max(300, Number(data.carousel_transition_ms) || fallback.transitionMs)),
      bottomEffect: (data.carousel_bottom_effect as any) || fallback.bottomEffect || "melting-wave",
    };
    saveStoredCarouselSettings(loaded);
    return loaded;
  } catch {
    return fallback;
  }
}

export async function adminSaveCarouselSettings(settings: CarouselAnimationSettings): Promise<void> {
  const validated: CarouselAnimationSettings = {
    autoplay: Boolean(settings.autoplay),
    intervalSeconds: Math.min(20, Math.max(3, Math.round(Number(settings.intervalSeconds) || 6))),
    transitionMs: Math.min(1500, Math.max(300, Math.round(Number(settings.transitionMs) || 1200))),
    bottomEffect: settings.bottomEffect || "melting-wave",
  };

  saveStoredCarouselSettings(validated);

  const supabase = createClient();
  if (!supabase) return;

  try {
    const updateData: any = {
      carousel_autoplay: validated.autoplay,
      carousel_interval_seconds: validated.intervalSeconds,
      carousel_transition_ms: validated.transitionMs,
      carousel_bottom_effect: validated.bottomEffect,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("store_settings")
      .update(updateData)
      .eq("is_active", true);

    if (error && error.message.includes("carousel_bottom_effect")) {
      delete updateData.carousel_bottom_effect;
      await supabase.from("store_settings").update(updateData).eq("is_active", true);
    }
  } catch (e: any) {
    console.warn("DB update carousel settings error:", e?.message);
  }
}
