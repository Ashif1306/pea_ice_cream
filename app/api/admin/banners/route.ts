import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BannerSlide, INITIAL_BANNERS } from "@/lib/banners-data";
import fs from "fs";
import path from "path";

const BANNERS_FILE = path.join(process.cwd(), "data", "banners.json");

function getFallbackBanners(): BannerSlide[] {
  try {
    if (fs.existsSync(BANNERS_FILE)) {
      const raw = fs.readFileSync(BANNERS_FILE, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) return list;
    }
  } catch (e) {
    console.error("Gagal membaca banners.json:", e);
  }
  return INITIAL_BANNERS;
}

function saveFallbackBanners(banners: BannerSlide[]): void {
  try {
    const dir = path.dirname(BANNERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(BANNERS_FILE, JSON.stringify(banners, null, 2), "utf-8");
  } catch (e) {
    console.error("Gagal menyimpan banners.json:", e);
  }
}

function resolveSlideImage(b: any): string {
  // 1. If product_cutout is a valid custom image / upload URL, use it
  if (b.product_cutout && !b.product_cutout.includes("/banners/banner-")) {
    return b.product_cutout;
  }
  // 2. If image_desktop is a valid custom image / upload URL, use it
  if (b.image_desktop && !b.image_desktop.includes("/banners/banner-")) {
    return b.image_desktop;
  }
  // 3. Any desktop / mobile image available
  if (b.image_desktop) return b.image_desktop;
  if (b.product_cutout) return b.product_cutout;
  if (b.image_mobile) return b.image_mobile;

  // 4. Fallback based on theme
  if (b.bg_theme === "yellow") return "/cutouts/pea-cup-vanilla.svg";
  if (b.bg_theme === "blue") return "/cutouts/pea-cup-chocolate.svg";
  if (b.bg_theme === "green") return "/cutouts/pea-cup-matcha.svg";
  return "/cutouts/pea-cup-strawberry.svg";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const supabase = createAdminClient() || createClient();
    if (supabase) {
      let query = supabase
        .from("banners")
        .select("*")
        .order("order_idx", { ascending: true });

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const banners: BannerSlide[] = data.map((b: any) => {
          const img = resolveSlideImage(b);
          return {
            id: b.id,
            order: b.order_idx || 1,
            isActive: b.is_active !== false,
            title: b.title || "Kelembutan yang menyatu dengan manis yang pas.",
            subtitle: b.subtitle || "Sajian es krim dengan cita rasa seimbang yang selalu tepat dinikmati kapan saja.",
            ctaText: b.cta_text || "Pesan Sekarang",
            ctaLink: b.cta_link || "/katalog",
            badge: b.badge || "Pea Ice Cream",
            flavorLabel: b.flavor_label || (b.bg_theme === "yellow" ? "Vanilla Dream" : b.bg_theme === "blue" ? "Chocolate Fudge" : b.bg_theme === "green" ? "Matcha Kyoto" : "Strawberry Bliss"),
            bgTheme: (b.bg_theme as any) || "pink",
            imageDesktop: img,
            imageMobile: b.image_mobile || img,
            imageAlt: b.image_alt || "Banner Pea Ice Cream",
            productCutout: img,
          };
        });

        // Save cache to banners.json for instant fallback
        saveFallbackBanners(banners);
        return NextResponse.json({ success: true, banners });
      }
    }

    // Fallback file
    const local = getFallbackBanners();
    const filtered = activeOnly ? local.filter((b) => b.isActive) : local;
    return NextResponse.json({ success: true, banners: filtered });
  } catch (err: any) {
    console.error("GET banners error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memuat banners." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const banner: BannerSlide = await request.json();

    if (!banner || !banner.id) {
      return NextResponse.json({ error: "Data banner tidak valid." }, { status: 400 });
    }

    const img = banner.productCutout || banner.imageDesktop || "/cutouts/pea-cup-strawberry.svg";
    const resolvedBanner: BannerSlide = {
      ...banner,
      imageDesktop: img,
      imageMobile: banner.imageMobile || img,
      productCutout: img,
    };

    const supabase = createAdminClient() || createClient();
    if (supabase) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(banner.id);
      const bannerId = isUuid ? banner.id : crypto.randomUUID();

      const payload: any = {
        id: bannerId,
        order_idx: banner.order || 1,
        is_active: banner.isActive !== false,
        title: banner.title || "Kelembutan yang menyatu dengan manis yang pas.",
        subtitle: banner.subtitle || "Sajian es krim dengan cita rasa seimbang yang selalu tepat dinikmati kapan saja.",
        cta_text: banner.ctaText || "Pesan Sekarang",
        cta_link: banner.ctaLink || "/katalog",
        badge: banner.badge || "Pea Ice Cream",
        bg_theme: banner.bgTheme || "pink",
        image_desktop: img,
        image_mobile: banner.imageMobile || img,
        image_alt: banner.imageAlt || "Banner Pea Ice Cream",
        product_cutout: img,
        flavor_label: banner.flavorLabel || banner.badge || "Pea Ice Cream",
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("banners").upsert(payload);
      if (error) {
        if (error.message.includes("product_cutout") || error.message.includes("flavor_label")) {
          delete payload.product_cutout;
          delete payload.flavor_label;
          await supabase.from("banners").upsert(payload);
        } else {
          console.warn("Supabase banner save warning:", error.message);
        }
      }
    }

    // Always update fallback file for guaranteed persistence on refresh
    const all = getFallbackBanners();
    const idx = all.findIndex((b) => b.id === banner.id || b.order === banner.order);
    if (idx >= 0) {
      all[idx] = resolvedBanner;
    } else {
      all.push(resolvedBanner);
    }
    all.sort((a, b) => a.order - b.order);
    saveFallbackBanners(all);

    return NextResponse.json({ success: true, banner: resolvedBanner });
  } catch (err: any) {
    console.error("POST banner error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal menyimpan banner." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { banners } = body;

    if (!Array.isArray(banners)) {
      return NextResponse.json({ error: "Banners array diperlukan." }, { status: 400 });
    }

    const supabase = createAdminClient() || createClient();
    if (supabase) {
      for (const b of banners) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.id);
        if (isUuid) {
          await supabase
            .from("banners")
            .update({ order_idx: b.order, is_active: b.isActive, updated_at: new Date().toISOString() })
            .eq("id", b.id);
        }
      }
    }

    saveFallbackBanners(banners);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PUT banners error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memperbarui urutan banner." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID banner diperlukan." }, { status: 400 });
    }

    const supabase = createAdminClient() || createClient();
    if (supabase) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        await supabase.from("banners").delete().eq("id", id);
      }
    }

    const all = getFallbackBanners();
    const updated = all.filter((b) => b.id !== id);
    saveFallbackBanners(updated);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE banner error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal menghapus banner." },
      { status: 500 }
    );
  }
}
