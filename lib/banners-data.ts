/**
 * lib/banners-data.ts
 * Data banner beranda dan pengaturan animasi carousel untuk Pea Ice Cream.
 */

export interface BannerSlide {
  id: string;
  order: number;
  isActive: boolean;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  badge?: string;
  flavorLabel?: string;
  bgTheme?: string;
  customBgColor?: string;
  imageDesktop: string;
  imageMobile?: string;
  imageAlt: string;
  productCutout?: string;
}

export interface ColorPreset {
  id: string;
  name: string;
  hex: string;
  description: string;
  badge?: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { id: "pink", name: "Pink Berry", hex: "#FF6B9D", description: "Warna signature khas Pea Ice Cream", badge: "Utama" },
  { id: "yellow", name: "Yellow Gold", hex: "#F5B738", description: "Warna cerah hangat rasa Vanilla Dream" },
  { id: "blue", name: "Blue Sky", hex: "#4A90E2", description: "Warna biru cerah rasa Chocolate Fudge" },
  { id: "green", name: "Mint Green", hex: "#43A047", description: "Warna hijau segar rasa Matcha Kyoto" },
  { id: "purple", name: "Taro Lavender", hex: "#9B51E0", description: "Warna ungu manis rasa Taro / Ube" },
  { id: "peach", name: "Sweet Peach", hex: "#FF7F50", description: "Warna jingga coral segar ceria" },
  { id: "pandan", name: "Pandan Nusantara", hex: "#2E7D32", description: "Warna hijau alami aroma daun pandan" },
  { id: "caramel", name: "Caramel Mocca", hex: "#8D6E63", description: "Warna cokelat gurih saus karamel" },
];

export function adjustHexBrightness(hex: string, percent: number): string {
  const cleanHex = hex.replace("#", "");
  const num = parseInt(cleanHex.length === 3 ? cleanHex.split("").map((c) => c + c).join("") : cleanHex, 16);
  if (isNaN(num)) return hex;
  const factor = percent / 100;
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(255 * factor)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + Math.round(255 * factor)));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + Math.round(255 * factor)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function getHeroGradient(themeOrHex?: string): string {
  if (!themeOrHex) return "linear-gradient(135deg, #FF6B9D 0%, #FF85B1 50%, #FFA1C5 100%)";

  // Check preset id
  const preset = COLOR_PRESETS.find((p) => p.id === themeOrHex);
  const baseHex = preset ? preset.hex : themeOrHex.startsWith("#") ? themeOrHex : "#FF6B9D";

  const light1 = adjustHexBrightness(baseHex, 12);
  const light2 = adjustHexBrightness(baseHex, 24);
  return `linear-gradient(135deg, ${baseHex} 0%, ${light1} 50%, ${light2} 100%)`;
}

export type BottomDividerEffect =
  | "melting-wave"
  | "ice-drips"
  | "cloud-puffs"
  | "layered-swirl"
  | "zigzag-waffle"
  | "smooth-curve"
  | "dripping-scallop"
  | "flat-clean";

export interface DividerEffectOption {
  id: BottomDividerEffect;
  name: string;
  description: string;
  badge?: string;
}

export const DIVIDER_EFFECTS: DividerEffectOption[] = [
  {
    id: "melting-wave",
    name: "Gelombang Meleleh (Default)",
    description: "Lengkung organik ganda lembut khas es krim meleleh dengan kedalaman natural.",
    badge: "Populer",
  },
  {
    id: "ice-drips",
    name: "Tetesan Es Krim (Ice Drips)",
    description: "Aksen tetesan es krim artisanal yang menetes manis ke bawah.",
    badge: "Favorit",
  },
  {
    id: "cloud-puffs",
    name: "Gumpalan Scoop (Cloud Puffs)",
    description: "Kubah bulat bertaut lembut menyerupai sendokan scoop es krim yang montok.",
  },
  {
    id: "layered-swirl",
    name: "Pusaran Bertingkat (Double Swirl)",
    description: "Garis lengkung bertingkat elegan dengan siluet gradasi kedalaman modern.",
  },
  {
    id: "zigzag-waffle",
    name: "Pola Cone Waffle (Crispy Zigzag)",
    description: "Pola gerigi geometris halus terinspirasi dari pinggiran waffle cone renyah.",
  },
  {
    id: "smooth-curve",
    name: "Lengkungan Mewah (Luxury Arch)",
    description: "Satu busur lengkung melandai minimalis dan elegan membentang luas.",
  },
  {
    id: "dripping-scallop",
    name: "Kubah Kerang Retro (Retro Scallop)",
    description: "Rangkaian lengkung simetris rapi bernuansa kedai es krim klasik.",
  },
  {
    id: "flat-clean",
    name: "Minimalis Bersih (Flat Edge)",
    description: "Pemisah lurus modern tanpa lengkungan, rapi dan kontemporer.",
  },
];

export interface CarouselAnimationSettings {
  autoplay: boolean;
  intervalSeconds: number; // 3 - 20
  transitionMs: number;    // 300 - 1500
  bottomEffect?: BottomDividerEffect;
}

export const DEFAULT_CAROUSEL_SETTINGS: CarouselAnimationSettings = {
  autoplay: true,
  intervalSeconds: 6,
  transitionMs: 1200,
  bottomEffect: "melting-wave",
};

export const INITIAL_BANNERS: BannerSlide[] = [
  {
    id: "00000000-0000-0000-0000-000000000011",
    order: 1,
    isActive: true,
    title: "Kelembutan yang menyatu dengan manis yang pas.",
    subtitle: "Sajian es krim dengan cita rasa seimbang yang selalu tepat dinikmati kapan saja.",
    ctaText: "Lihat Semua Menu",
    ctaLink: "/katalog",
    badge: "ice cream classic",
    flavorLabel: "Strawberry Bliss",
    bgTheme: "pink",
    imageDesktop: "https://ecgdswzpkjyednnvbbav.supabase.co/storage/v1/object/public/pea-assets/banners/1795526626935-n2asut.png",
    imageMobile: "https://ecgdswzpkjyednnvbbav.supabase.co/storage/v1/object/public/pea-assets/banners/1795526626935-n2asut.png",
    imageAlt: "Sajian es krim homemade klasik Pea Ice Cream Makassar",
    productCutout: "https://ecgdswzpkjyednnvbbav.supabase.co/storage/v1/object/public/pea-assets/banners/1795526626935-n2asut.png",
  },
  {
    id: "00000000-0000-0000-0000-000000000012",
    order: 2,
    isActive: true,
    title: "Temukan rasa favoritmu hari ini.",
    subtitle: "Pilih aneka rasa favorit dan kombinasikan 2 rasa sekaligus dalam satu cup lembut.",
    ctaText: "Pilih Rasa Favorit",
    ctaLink: "/katalog",
    badge: "Pea Ice Cream",
    flavorLabel: "Vanilla Dream",
    bgTheme: "yellow",
    imageDesktop: "https://ecgdswzpkjyednnvbbav.supabase.co/storage/v1/object/public/pea-assets/banners/1795526788486-rczz9x.png",
    imageMobile: "https://ecgdswzpkjyednnvbbav.supabase.co/storage/v1/object/public/pea-assets/banners/1795526788486-rczz9x.png",
    imageAlt: "Pilihan varian rasa es krim Pea Ice Cream dalam cup",
    productCutout: "https://ecgdswzpkjyednnvbbav.supabase.co/storage/v1/object/public/pea-assets/banners/1795526788486-rczz9x.png",
  },
  {
    id: "00000000-0000-0000-0000-000000000013",
    order: 3,
    isActive: true,
    title: "Momen manis untuk dinikmati bersama.",
    subtitle: "Jelajahi pilihan paket berbagi Pea untuk kebersamaan keluarga dan sahabat tercinta.",
    ctaText: "Lihat Paket Berbagi",
    ctaLink: "/katalog?kategori=seasonal",
    badge: "paket berbagi",
    flavorLabel: "Chocolate Fudge",
    bgTheme: "blue",
    imageDesktop: "https://ecgdswzpkjyednnvbbav.supabase.co/storage/v1/object/public/pea-assets/banners/1795525865129-z6k670.png",
    imageMobile: "https://ecgdswzpkjyednnvbbav.supabase.co/storage/v1/object/public/pea-assets/banners/1795525865129-z6k670.png",
    imageAlt: "Paket berbagi es krim Pea untuk dinikmati bersama",
    productCutout: "https://ecgdswzpkjyednnvbbav.supabase.co/storage/v1/object/public/pea-assets/banners/1795525865129-z6k670.png",
  },
  {
    id: "18040a2f-8190-48c7-b32f-7579fd256906",
    order: 4,
    isActive: true,
    title: "Kelembutan yang menyatu dengan manis yang pas.",
    subtitle: "Sajian es krim dengan cita rasa seimbang yang selalu tepat dinikmati kapan saja.",
    ctaText: "Pesan Sekarang",
    ctaLink: "/katalog",
    badge: "Pea Ice Cream",
    flavorLabel: "Matcha Kyoto",
    bgTheme: "green",
    imageDesktop: "https://ecgdswzpkjyednnvbbav.supabase.co/storage/v1/object/public/pea-assets/banners/1795525888886-c1gbyh.png",
    imageMobile: "https://ecgdswzpkjyednnvbbav.supabase.co/storage/v1/object/public/pea-assets/banners/1795525888886-c1gbyh.png",
    imageAlt: "Cup es krim Matcha Kyoto Pea Ice Cream",
    productCutout: "https://ecgdswzpkjyednnvbbav.supabase.co/storage/v1/object/public/pea-assets/banners/1795525888886-c1gbyh.png",
  },
];

export const STORAGE_KEY = "pea_banners_demo";
export const SETTINGS_STORAGE_KEY = "pea_carousel_settings";

/**
 * Ambil banner aktif dari localStorage atau fallback ke INITIAL_BANNERS
 */
export function getStoredBanners(): BannerSlide[] {
  if (typeof window === "undefined") return INITIAL_BANNERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_BANNERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((b) => {
        const img = b.productCutout || b.imageDesktop || b.imageMobile;
        return {
          ...b,
          imageDesktop: img || b.imageDesktop,
          productCutout: img || b.productCutout,
          title: (!b.title || b.title.includes("Rasa klasik") || b.title.includes("scoop")) ? "Kelembutan yang menyatu dengan manis yang pas." : b.title,
          subtitle: (!b.subtitle || b.subtitle.includes("Homemade ice cream") || b.subtitle.includes("Makassar")) ? "Sajian es krim dengan cita rasa seimbang yang selalu tepat dinikmati kapan saja." : b.subtitle,
          badge: (!b.badge || b.badge.includes("homemade")) ? "Pea Ice Cream" : b.badge,
          ctaText: "Pesan Sekarang",
        };
      });
    }
  } catch (e) {
    console.error("Gagal membaca banner dari localStorage", e);
  }
  return INITIAL_BANNERS;
}

/**
 * Simpan banner ke localStorage (Demo Layer) dan picu event update
 */
export function saveStoredBanners(banners: BannerSlide[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(banners));
    window.dispatchEvent(new Event("pea_banners_changed"));
  } catch (e) {
    console.error("Gagal menyimpan banner ke localStorage", e);
  }
}

const VALID_DIVIDERS: BottomDividerEffect[] = [
  "melting-wave",
  "ice-drips",
  "cloud-puffs",
  "layered-swirl",
  "zigzag-waffle",
  "smooth-curve",
  "dripping-scallop",
  "flat-clean",
];

/**
 * Ambil pengaturan animasi carousel dari localStorage atau default
 */
export function getStoredCarouselSettings(): CarouselAnimationSettings {
  if (typeof window === "undefined") return DEFAULT_CAROUSEL_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const chosenEffect: BottomDividerEffect = VALID_DIVIDERS.includes(parsed.bottomEffect)
        ? parsed.bottomEffect
        : DEFAULT_CAROUSEL_SETTINGS.bottomEffect || "melting-wave";

      return {
        autoplay: parsed.autoplay !== false,
        intervalSeconds: Math.min(20, Math.max(3, Number(parsed.intervalSeconds) || DEFAULT_CAROUSEL_SETTINGS.intervalSeconds)),
        transitionMs: Math.min(1500, Math.max(300, Number(parsed.transitionMs) || DEFAULT_CAROUSEL_SETTINGS.transitionMs)),
        bottomEffect: chosenEffect,
      };
    }
  } catch {}
  return DEFAULT_CAROUSEL_SETTINGS;
}

/**
 * Simpan pengaturan animasi carousel ke localStorage dan picu event update
 */
export function saveStoredCarouselSettings(settings: CarouselAnimationSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event("pea_carousel_settings_changed"));
  } catch {}
}
