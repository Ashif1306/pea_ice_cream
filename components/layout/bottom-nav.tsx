"use client";

/**
 * components/layout/bottom-nav.tsx
 * Mobile-only bottom navigation bar for Pea Ice Cream.
 * Hidden on md+ screens (desktop uses the header nav).
 * Pages should add pb-20 (or the .page-with-bottom-nav class) so content
 * is never obscured by this bar.
 */

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/contexts/cart-context";

// ─── Icons ────────────────────────────────────────────────────────────────────

function HomeIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className="w-6 h-6 flex-shrink-0" style={{ width: "24px", height: "24px", maxWidth: "24px", maxHeight: "24px" }} aria-hidden="true">
      {filled ? (
        <path
          fill="currentColor"
          d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
        />
      ) : (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12L12 3l9 9M5 10v10h5v-6h4v6h5V10"
        />
      )}
    </svg>
  );
}

function CatalogIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className="w-6 h-6 flex-shrink-0" style={{ width: "24px", height: "24px", maxWidth: "24px", maxHeight: "24px" }} aria-hidden="true">
      {filled ? (
        <path
          fill="currentColor"
          d="M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z"
        />
      ) : (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z"
        />
      )}
    </svg>
  );
}

function CartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className="w-6 h-6 flex-shrink-0" style={{ width: "24px", height: "24px", maxWidth: "24px", maxHeight: "24px" }} aria-hidden="true">
      {filled ? (
        <path
          fill="currentColor"
          d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zm7 14a2 2 0 110-4 2 2 0 010 4zm-7 0a2 2 0 110-4 2 2 0 010 4zm0-10h14M6 6h12"
        />
      ) : (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zm0 4h14M9 10a3 3 0 006 0"
        />
      )}
    </svg>
  );
}

function OrderIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className="w-6 h-6 flex-shrink-0" style={{ width: "24px", height: "24px", maxWidth: "24px", maxHeight: "24px" }} aria-hidden="true">
      {filled ? (
        <path
          fill="currentColor"
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM9 17H7v-2h2v2zm0-4H7v-2h2v2zm0-4H7V7h2v2zm7 8h-5v-2h5v2zm0-4h-5v-2h5v2zm-1-5V3.5L18.5 9H15z"
        />
      ) : (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M9 17H7M9 13H7M9 9H7M13 17h4M13 13h4"
        />
      )}
    </svg>
  );
}

// ─── Nav Items Config ─────────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  icon: (props: { filled: boolean }) => React.ReactElement;
  showBadge?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/",         label: "Beranda",  icon: HomeIcon },
  { href: "/katalog",  label: "Katalog",  icon: CatalogIcon },
  { href: "/keranjang", label: "Keranjang", icon: CartIcon, showBadge: true },
  { href: "/pesanan",  label: "Pesanan",  icon: OrderIcon },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  // Hide customer bottom nav when browsing admin section
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <nav
      className={cn(
        // Show only on mobile, hidden on md+
        "fixed bottom-0 left-0 right-0 z-30 md:hidden",
        "bg-white/95 backdrop-blur-md",
        "border-t border-pink-100",
        "shadow-[0_-4px_16px_rgba(255,107,157,0.10)]",
        // Safe-area padding for iOS notch
        "pb-safe"
      )}
      aria-label="Navigasi bawah"
    >
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ href, label, icon: Icon, showBadge }) => {
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));
          const badgeCount = showBadge ? totalItems : 0;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1",
                "relative",
                "transition-colors duration-150",
                isActive ? "text-brand-pink" : "text-gray-400 hover:text-brand-pink-light"
              )}
              aria-current={isActive ? "page" : undefined}
              aria-label={
                showBadge && badgeCount > 0
                  ? `${label} — ${badgeCount} produk`
                  : label
              }
            >
              {/* Active indicator pill */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-gradient-to-r from-brand-pink to-brand-pink-light rounded-b-full"
                  aria-hidden="true"
                />
              )}

              {/* Icon with optional badge */}
              <span className="relative">
                <Icon filled={isActive} />
                {badgeCount > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1.5 -right-2",
                      "min-w-[16px] h-4 px-1",
                      "bg-brand-pink text-white",
                      "text-[10px] font-bold font-nunito leading-none",
                      "rounded-full flex items-center justify-center",
                      "ring-2 ring-white"
                    )}
                    aria-hidden="true"
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </span>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] font-semibold font-nunito leading-none",
                  isActive ? "text-brand-pink" : "text-gray-400"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
