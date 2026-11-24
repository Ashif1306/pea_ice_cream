import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn — class name helper
 *
 * Combines clsx (conditional class logic) with tailwind-merge (deduplication
 * of conflicting Tailwind utilities) so callers never need to worry about
 * class ordering or conflicts.
 *
 * @example
 *   cn("px-4 py-2", isActive && "bg-brand-pink", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

/**
 * Format a number as Indonesian Rupiah.
 * @example formatRupiah(15000) → "Rp 15.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style:    "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("IDR", "Rp")
    .trim();
}

/**
 * Slugify a string into a URL-safe identifier.
 * @example slugify("Matcha Green Tea") → "matcha-green-tea"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Clamp a number between min and max (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Returns true if the code is running in a browser environment.
 */
export const isBrowser = typeof window !== "undefined";
