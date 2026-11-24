// ─────────────────────────────────────────────────────────────────────────────
// lib/dummy-data.ts
// DUMMY DATA – Replace with Supabase queries in next phase
// ─────────────────────────────────────────────────────────────────────────────

import type { CupSize, OrderStatus, ProductCategory } from "./constants";
import { CUP_SIZE_PRICES } from "./constants";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProductSize {
  size: CupSize;
  /** Price in IDR (integer) */
  price: number;
  /** Whether this size allows mix of 2 flavours */
  allowMixFlavors: boolean;
}

export interface StockEntry {
  flavor: string;
  size: CupSize;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  flavors: string[];
  sizes: ProductSize[];
  /** Lowest available price (for display / sorting) */
  basePrice: number;
  images: string[];
  /** stock[flavorSlug][size] = quantity */
  stock: Record<string, Record<CupSize, number>>;
  category: ProductCategory;
  allergens: string[];
  isAvailable: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  isArchived?: boolean;
  categoryId?: string;
  categoryName?: string;
  // Mix rasa selection configuration per product
  isMixEnabled?: boolean;
  minFlavorCount?: number; // e.g. 1
  maxFlavorCount?: number; // e.g. 2, 3
  // Dynamic flavor options configuration per product (legacy backwards-compatible)
  hasFlavorSelection?: boolean;
  flavorChoiceLabel?: string; // e.g. "Rasa" or "Scoop"
  flavorChoiceCount?: number; // e.g. 1, 2, 3
  allowSameFlavor?: boolean; // whether same flavor allowed more than once
  allowedFlavors?: Array<{
    id?: string;
    productId?: string;
    flavorId: string;
    flavorName?: string;
    flavorImageUrl?: string;
    isFlavorAvailable?: boolean;
    extraPrice: number;
    orderIdx: number;
    isActive: boolean;
  }>;
}

export interface OrderItem {
  productId: string;
  productName: string;
  flavor: string | [string, string]; // single or mix
  size: CupSize;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  note?: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function makeStock(
  flavors: string[],
  quantities: Partial<Record<CupSize, number>> = {}
): Record<string, Record<CupSize, number>> {
  const stock: Record<string, Record<CupSize, number>> = {};
  for (const flavor of flavors) {
    const key = flavor.toLowerCase().replace(/\s+/g, "-");
    stock[key] = {
      small:  quantities.small  ?? 20,
      medium: quantities.medium ?? 15,
      large:  quantities.large  ?? 10,
    };
  }
  return stock;
}

function makeSizes(
  overrides: Partial<Record<CupSize, { price?: number; allowMixFlavors?: boolean }>> = {}
): ProductSize[] {
  const sizes: CupSize[] = ["small", "medium", "large"];
  return sizes.map((size) => ({
    size,
    price:          overrides[size]?.price          ?? CUP_SIZE_PRICES[size],
    allowMixFlavors: overrides[size]?.allowMixFlavors ?? (size !== "small"),
  }));
}

// ─── DUMMY DATA – Empty by default (products populated via Admin Panel) ─────

export const DUMMY_PRODUCTS: Product[] = [];

// ─── DUMMY ORDERS – Replace with Supabase queries in next phase ──────────────

export const DUMMY_ORDERS: Order[] = [
  // ── Order 1: pending ───────────────────────────────────────────────────────
  {
    id: "order-20241120-001",
    customerName: "Budi Santoso",
    customerPhone: "08123456789",
    items: [
      {
        productId:   "prod-004",
        productName: "Matcha Kyoto",
        flavor:      "Matcha",
        size:        "medium",
        quantity:    2,
        unitPrice:   23_000,
        subtotal:    46_000,
      },
      {
        productId:   "prod-006",
        productName: "Pandan Nusantara",
        flavor:      ["Pandan", "Pandan Coconut"], // mix
        size:        "large",
        quantity:    1,
        unitPrice:   25_000,
        subtotal:    25_000,
      },
    ],
    totalAmount: 71_000,
    status:      "pending",
    note:        "Tolong jangan terlalu manis ya kak 🙏",
    createdAt:   "2024-11-20T09:15:00+07:00",
    updatedAt:   "2024-11-20T09:15:00+07:00",
  },

  // ── Order 2: confirmed ─────────────────────────────────────────────────────
  {
    id: "order-20241119-002",
    customerName: "Siti Rahma",
    customerPhone: "08987654321",
    items: [
      {
        productId:   "prod-007",
        productName: "Durian King",
        flavor:      "Durian Musang King",
        size:        "large",
        quantity:    1,
        unitPrice:   35_000,
        subtotal:    35_000,
      },
      {
        productId:   "prod-001",
        productName: "Vanilla Dream",
        flavor:      "Vanilla",
        size:        "small",
        quantity:    3,
        unitPrice:   15_000,
        subtotal:    45_000,
      },
    ],
    totalAmount: 80_000,
    status:      "confirmed",
    note:        "Untuk acara ulang tahun anak, mohon dikemas dengan cantik 🎂",
    createdAt:   "2024-11-19T14:30:00+07:00",
    updatedAt:   "2024-11-19T14:45:00+07:00",
  },

  // ── Order 3: delivered ─────────────────────────────────────────────────────
  {
    id: "order-20241118-003",
    customerName: "Ahmad Fauzi",
    customerPhone: "08567891234",
    items: [
      {
        productId:   "prod-002",
        productName: "Chocolate Fudge",
        flavor:      ["Dark Chocolate", "Milk Chocolate"], // mix
        size:        "medium",
        quantity:    2,
        unitPrice:   20_000,
        subtotal:    40_000,
      },
      {
        productId:   "prod-008",
        productName: "Taro Purple",
        flavor:      "Taro Classic",
        size:        "medium",
        quantity:    1,
        unitPrice:   21_000,
        subtotal:    21_000,
      },
      {
        productId:   "prod-005",
        productName: "Mango Tropical",
        flavor:      "Mango Sorbet",
        size:        "small",
        quantity:    2,
        unitPrice:   15_000,
        subtotal:    30_000,
      },
    ],
    totalAmount: 91_000,
    status:      "delivered",
    createdAt:   "2024-11-18T11:00:00+07:00",
    updatedAt:   "2024-11-18T13:30:00+07:00",
  },
];

// ─── Convenience exports ──────────────────────────────────────────────────────

/** Look up a product by ID */
export function getProductById(id: string): Product | undefined {
  return DUMMY_PRODUCTS.find((p) => p.id === id);
}

/** Filter products by category */
export function getProductsByCategory(category: ProductCategory): Product[] {
  return DUMMY_PRODUCTS.filter((p) => p.category === category && p.isAvailable);
}

/** Get bestseller products */
export function getBestsellers(): Product[] {
  return DUMMY_PRODUCTS.filter((p) => p.isBestseller && p.isAvailable);
}

/** Get new / featured products */
export function getNewProducts(): Product[] {
  return DUMMY_PRODUCTS.filter((p) => p.isNew && p.isAvailable);
}
