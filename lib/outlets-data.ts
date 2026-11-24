/**
 * lib/outlets-data.ts
 * Data lokasi toko utama (Main Store) dan cabang outlet Pea Ice Cream di Makassar.
 * Dilengkapi dengan jam buka/tutup dinamis dan deteksi status operasional real-time.
 */

export interface OutletLocation {
  id: string;
  name: string;
  type: "main" | "branch"; // "main" = Main Store, "branch" = Outlet Mall
  address: string;
  detailLocation?: string; // e.g. "Lt. Basement (Depan Mr.DIY)"
  city: string;
  hours: string; // e.g. "Setiap Hari: 10.00 – 18.00 WITA"
  openTime: string; // e.g. "10:00" (format 24 jam HH:mm)
  closeTime: string; // e.g. "18:00" atau "22:00" (format 24 jam HH:mm)
  googleMapsUrl?: string;
  phone?: string;
  isActive: boolean;
  order: number;
}

export const DEFAULT_OUTLETS: OutletLocation[] = [
  {
    id: "outlet-main-store",
    name: "Main Store",
    type: "main",
    address: "Jl. Sungai Kelara 38, Makassar",
    detailLocation: "Toko Pusat Pea Ice Cream",
    city: "Makassar",
    hours: "Everyday 10.00 – 18.00 WITA",
    openTime: "10:00",
    closeTime: "18:00",
    googleMapsUrl: "https://maps.google.com/?q=Jl.+Sungai+Kelara+38+Makassar",
    phone: "081234567890",
    isActive: true,
    order: 1,
  },
  {
    id: "outlet-mall-nipah",
    name: "Mall Nipah",
    type: "branch",
    address: "Mall Nipah, Jl. Urip Sumoharjo, Makassar",
    detailLocation: "Lt. Basement (Depan Mr.DIY)",
    city: "Makassar",
    hours: "Everyday 10.00 – 22.00 WITA",
    openTime: "10:00",
    closeTime: "22:00",
    googleMapsUrl: "https://maps.google.com/?q=Nipah+Mall+Makassar",
    phone: "081234567890",
    isActive: true,
    order: 2,
  },
  {
    id: "outlet-panakkukang-square",
    name: "Mall Panakukang Square",
    type: "branch",
    address: "Mall Panakkukang Square, Jl. Pengayoman, Makassar",
    detailLocation: "Jembatan Penyeberangan PS ~ MP (Samping Coffeholic)",
    city: "Makassar",
    hours: "Everyday 10.00 – 22.00 WITA",
    openTime: "10:00",
    closeTime: "22:00",
    googleMapsUrl: "https://maps.google.com/?q=Panakkukang+Square+Makassar",
    phone: "081234567890",
    isActive: true,
    order: 3,
  },
  {
    id: "outlet-panakkukang-lt2",
    name: "Mall Panakukang Lt. 2",
    type: "branch",
    address: "Mall Panakkukang, Jl. Boulevard, Makassar",
    detailLocation: "Lt. 2 (Depan Kedai Nano, Selantai Watson)",
    city: "Makassar",
    hours: "Everyday 10.00 – 22.00 WITA",
    openTime: "10:00",
    closeTime: "22:00",
    googleMapsUrl: "https://maps.google.com/?q=Mall+Panakkukang+Makassar",
    phone: "081234567890",
    isActive: true,
    order: 4,
  },
  {
    id: "outlet-mall-ratu-indah",
    name: "Mall Ratu Indah",
    type: "branch",
    address: "Mall Ratu Indah (MaRI), Jl. Dr. Sam Ratulangi, Makassar",
    detailLocation: "Lt. 4 (Samping SAO Foodcourt)",
    city: "Makassar",
    hours: "Everyday 10.00 – 22.00 WITA",
    openTime: "10:00",
    closeTime: "22:00",
    googleMapsUrl: "https://maps.google.com/?q=Mall+Ratu+Indah+Makassar",
    phone: "081234567890",
    isActive: true,
    order: 5,
  },
];

export const OUTLETS_STORAGE_KEY = "pea_outlets_data";

export function getStoredOutlets(): OutletLocation[] {
  if (typeof window === "undefined") return DEFAULT_OUTLETS;
  try {
    const raw = localStorage.getItem(OUTLETS_STORAGE_KEY);
    if (!raw) return DEFAULT_OUTLETS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure openTime and closeTime are populated if older items lack them
      return parsed.map((item) => {
        const defaultMatch = DEFAULT_OUTLETS.find((d) => d.id === item.id);
        return {
          ...item,
          openTime: item.openTime || defaultMatch?.openTime || "10:00",
          closeTime: item.closeTime || defaultMatch?.closeTime || (item.type === "main" ? "18:00" : "22:00"),
        };
      });
    }
  } catch (e) {
    console.error("Gagal membaca data outlet dari localStorage:", e);
  }
  return DEFAULT_OUTLETS;
}

export function saveStoredOutlets(outlets: OutletLocation[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OUTLETS_STORAGE_KEY, JSON.stringify(outlets));
    window.dispatchEvent(new Event("pea_outlets_changed"));
  } catch (e) {
    console.error("Gagal menyimpan data outlet ke localStorage:", e);
  }
}

/**
 * Format string display operasional dari openTime dan closeTime
 */
export function formatHoursString(openTime: string, closeTime: string, prefix = "Everyday"): string {
  const cleanOpen = openTime ? openTime.replace(":", ".") : "10.00";
  const cleanClose = closeTime ? closeTime.replace(":", ".") : "22.00";
  return `${prefix} ${cleanOpen} – ${cleanClose} WITA`;
}

export interface OutletStatusInfo {
  isOpen: boolean;
  statusText: "Buka" | "Tutup";
  timeNote: string;
  badgeBg: string;
  badgeTextColor: string;
  dotColor: string;
  currentTimeString: string;
}

/**
 * Menghitung status apakah outlet sedang buka atau tutup berdasarkan jam operasional
 * dan jam saat ini (WITA / UTC+8 atau jam perangkat pengguna).
 */
export function getOutletStatus(
  outlet: { openTime?: string; closeTime?: string; hours?: string; type?: string },
  customDate?: Date
): OutletStatusInfo {
  const now = customDate || new Date();

  // Dapatkan jam dan menit saat ini
  // Prioritaskan WITA (Asia/Makassar, UTC+8) jika didukung, fallback ke lokal
  let currentMinutes: number;
  let currentTimeString = "";

  try {
    const timeParts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Makassar",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);

    const h = Number(timeParts.find((p) => p.type === "hour")?.value || now.getHours());
    const m = Number(timeParts.find((p) => p.type === "minute")?.value || now.getMinutes());
    currentMinutes = h * 60 + m;
    currentTimeString = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  } catch {
    const h = now.getHours();
    const m = now.getMinutes();
    currentMinutes = h * 60 + m;
    currentTimeString = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  // Parse jam buka dan tutup
  let openMin = 10 * 60; // 10:00 (600 menit)
  let closeMin = outlet.type === "main" ? 18 * 60 : 22 * 60; // 18:00 atau 22:00

  if (outlet.openTime) {
    const [oh, om] = outlet.openTime.split(":").map(Number);
    if (!isNaN(oh)) openMin = oh * 60 + (om || 0);
  }
  if (outlet.closeTime) {
    const [ch, cm] = outlet.closeTime.split(":").map(Number);
    if (!isNaN(ch)) closeMin = ch * 60 + (cm || 0);
  }

  // Fallback parsing jika openTime / closeTime belum disetel
  if (!outlet.openTime && !outlet.closeTime && outlet.hours) {
    const match = outlet.hours.match(/(\d{1,2})[.:](\d{2})\s*[–-]\s*(\d{1,2})[.:](\d{2})/);
    if (match) {
      openMin = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      closeMin = parseInt(match[3], 10) * 60 + parseInt(match[4], 10);
    }
  }

  const formatMinToText = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}.${String(m).padStart(2, "0")}`;
  };

  const isOpen = currentMinutes >= openMin && currentMinutes < closeMin;

  let timeNote = "";
  if (isOpen) {
    timeNote = `Tutup jam ${formatMinToText(closeMin)} WITA`;
  } else {
    if (currentMinutes < openMin) {
      timeNote = `Buka jam ${formatMinToText(openMin)} WITA`;
    } else {
      timeNote = `Buka besok ${formatMinToText(openMin)} WITA`;
    }
  }

  return {
    isOpen,
    statusText: isOpen ? "Buka" : "Tutup",
    timeNote,
    badgeBg: isOpen ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200",
    badgeTextColor: isOpen ? "text-emerald-700" : "text-rose-700",
    dotColor: isOpen ? "bg-emerald-500" : "bg-rose-500",
    currentTimeString,
  };
}
