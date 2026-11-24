// ─────────────────────────────────────────────────────────────────────────────
// lib/constants.ts
// Business constants for Pea Ice Cream
// ─────────────────────────────────────────────────────────────────────────────

// ─── Brand Identity ──────────────────────────────────────────────────────────

export const BRAND_NAME = "Pea Ice Cream" as const;

export const BRAND_TAGLINE_PRIMARY =
  "ice cream classic • homemade ice cream" as const;

export const BRAND_TAGLINES = [
  "ice cream classic",
  "homemade ice cream",
] as const;

/**
 * Tagline dalam evaluasi internal:
 * CONTENT_VERIFY: Klaim "sehat tanpa pengawet" memerlukan verifikasi pemilik
 * terkait uji lab/sertifikasi sebelum boleh ditampilkan ke publik.
 */
export const PENDING_VERIFICATION_TAGLINE =
  "sehat tanpa pengawet" as const;

/** Short descriptor shown in meta tags and OG images */
export const BRAND_DESCRIPTION =
  "Es krim artisan premium dengan cita rasa lokal dan internasional. " +
  "Tersedia dalam berbagai ukuran, bisa mix rasa, pesan via WhatsApp.";

// ─── Contact & Social ────────────────────────────────────────────────────────

/**
 * WhatsApp business number.
 * TODO: Replace with real number before going live.
 * Format: international without leading + (e.g. "6281234567890")
 */
export const WHATSAPP_NUMBER = "6281234567890"; // PLACEHOLDER – replace with real number

/** Pre-filled WhatsApp message template */
export const WHATSAPP_MESSAGE_TEMPLATE =
  "Halo Pea Ice Cream! Saya ingin memesan es krim 🍦";

/** Full wa.me URL ready to use as an href */
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE_TEMPLATE
)}`;

export const INSTAGRAM_HANDLE = "@pea.icecream"; // PLACEHOLDER
export const TIKTOK_HANDLE    = "@pea.icecream"; // PLACEHOLDER

// ─── Business Hours ──────────────────────────────────────────────────────────

export const BUSINESS_HOURS = {
  open:  "10:00",
  close: "21:00",
  timezone: "Asia/Jakarta", // WIB (UTC+7)
  daysOpen: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"],
} as const;

// ─── Ordering ────────────────────────────────────────────────────────────────

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending:   "Menunggu Konfirmasi",
  confirmed: "Dikonfirmasi",
  preparing: "Sedang Dipersiapkan",
  ready:     "Siap Diambil",
  delivered: "Selesai",
  cancelled: "Dibatalkan",
};

// ─── Product Categories ──────────────────────────────────────────────────────

export const PRODUCT_CATEGORIES = [
  "signature",
  "classic",
  "local-flavors",
  "seasonal",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  signature:     "Signature",
  classic:       "Classic",
  "local-flavors": "Cita Rasa Lokal",
  seasonal:      "Musiman",
};

// ─── Cup Sizes ───────────────────────────────────────────────────────────────

export const CUP_SIZES = ["small", "medium", "large"] as const;
export type CupSize = (typeof CUP_SIZES)[number];

export const CUP_SIZE_LABELS: Record<CupSize, string> = {
  small:  "Cup Kecil",
  medium: "Cup Sedang",
  large:  "Cup Besar",
};

export const CUP_SIZE_PRICES: Record<CupSize, number> = {
  small:  15_000,
  medium: 20_000,
  large:  25_000,
};

// ─── Feature Flags ───────────────────────────────────────────────────────────

export const FEATURE_FLAGS = {
  /** Show dummy data banners in development */
  SHOW_DUMMY_DATA_BANNER: process.env.NODE_ENV !== "production",
  /** Enable mix-flavour selection UI */
  ENABLE_MIX_FLAVORS: true,
  /** Enable online order tracking page */
  ENABLE_ORDER_TRACKING: true,
} as const;

// ─── SEO / Meta ──────────────────────────────────────────────────────────────

export const META = {
  siteName:    BRAND_NAME,
  title:       `${BRAND_NAME} – Es Krim Artisan Premium`,
  description: BRAND_DESCRIPTION,
  url:         "https://peaicecream.com", // PLACEHOLDER – replace with real domain
  ogImage:     "/og-image.jpg",           // PLACEHOLDER – add real OG image to /public
  locale:      "id_ID",
  themeColor:  "#FF6B9D",
} as const;
