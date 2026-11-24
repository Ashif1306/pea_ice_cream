/**
 * lib/apps-data.ts
 * Shared data and definitions for delivery apps (GoFood, GrabFood, ShopeeFood, Maxim).
 * Can be safely imported in both Server Components/Routes and Client Components.
 */

export interface DeliveryAppItem {
  id?: string;
  name: string;
  url: string;
  icon?: string;
  badge?: string;
  description?: string;
  is_active?: boolean;
}

export const DEFAULT_PARTNER_APPS: DeliveryAppItem[] = [
  {
    id: "app-gofood",
    name: "GoFood",
    url: "https://gofood.link",
    icon: "/apps/gofood.svg",
    badge: "Paling Populer",
    description: "Pesan es krim favoritmu lewat GoFood",
    is_active: true,
  },
  {
    id: "app-grabfood",
    name: "GrabFood",
    url: "https://food.grab.com",
    icon: "/apps/grabfood.svg",
    badge: "Banyak Promo",
    description: "Nikmati penawaran hemat di GrabFood",
    is_active: true,
  },
  {
    id: "app-shopeefood",
    name: "ShopeeFood",
    url: "https://shopee.co.id/now-food",
    icon: "/apps/shopeefood.svg",
    badge: "Gratis Ongkir",
    description: "Voucher diskon & ongkir di ShopeeFood",
    is_active: true,
  },
  {
    id: "app-maxim",
    name: "Maxim Food",
    url: "https://taximaxim.com",
    icon: "/apps/maxim.svg",
    badge: "Hemat",
    description: "Pengantaran praktis via Maxim Food",
    is_active: true,
  },
];
