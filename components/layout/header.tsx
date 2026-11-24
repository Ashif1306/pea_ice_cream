"use client";

/**
 * components/layout/header.tsx
 * Solid White Sticky Navigation Header for Pea Ice Cream.
 * - Solid white background from the very first frame (crisp, readable, clean)
 * - Deep navy brand text (#1E3A5F), crisp logo, contrast pink active capsule item
 * - Cart button with yellow quantity badge
 * - Clean mobile drawer with solid background
 */

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/contexts/cart-context";
import { ShoppingCart, Menu, X, Check } from "lucide-react";

// ─── Nav Links ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: "/",        label: "Beranda" },
  { href: "/katalog", label: "Menu" },
  { href: "/tentang", label: "Tentang Pea" },
  { href: "/#kontak", label: "Kontak" },
] as const;

// ─── Mobile Drawer ───────────────────────────────────────────────────────────

function MobileDrawer({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Solid Dimmer Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-brand-dark-blue/40 backdrop-blur-sm z-50 transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Solid White Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-80 max-w-[85vw] z-50",
          "bg-white shadow-2xl flex flex-col",
          "transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-label="Menu navigasi utama"
        aria-modal="true"
      >
        {/* Header inside drawer */}
        <div className="flex items-center justify-between p-5 border-b border-pink-100 bg-pink-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-brand-pink/30">
              <Image
                src="/logo.jpg"
                alt="Logo Pea Ice Cream"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-fredoka text-lg text-brand-dark-blue font-bold">
              pea ice cream
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white text-brand-dark-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5 text-brand-dark-blue" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 flex flex-col p-5 gap-1.5 overflow-y-auto" aria-label="Menu mobile">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl",
                  "font-nunito font-bold text-base transition-all duration-150",
                  isActive
                    ? "bg-brand-pink text-white shadow-sm"
                    : "text-brand-dark-blue hover:bg-pink-50 hover:text-brand-pink"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <span>{label}</span>
                {isActive && <Check className="w-4 h-4 text-white" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-5 border-t border-pink-100 bg-pink-50/30 text-center">
          <p className="text-xs text-brand-dark-blue/80 font-nunito font-semibold">
            🍦 Homemade Ice Cream Makassar
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Main Header Component ────────────────────────────────────────────────────

export function Header() {
  const { totalItems } = useCart();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Hide on admin portal
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <header
        className="sticky top-0 left-0 right-0 z-40 w-full bg-white border-b border-pink-100 shadow-sm"
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">

            {/* ── Brand Logo & Name (Always dark blue, solid & crisp) ── */}
            <Link
              href="/"
              className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink rounded-xl p-1"
              aria-label="Pea Ice Cream — halaman utama"
            >
              <div
                className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-brand-pink/30 group-hover:ring-brand-pink transition-all flex-shrink-0"
                style={{ width: "40px", height: "40px" }}
              >
                <Image
                  src="/logo.jpg"
                  alt="Logo Pea Ice Cream"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <span className="font-fredoka text-xl sm:text-2xl font-bold tracking-tight text-brand-dark-blue">
                pea ice cream
              </span>
            </Link>

            {/* ── Desktop Capsule Nav (Centered, solid background) ── */}
            <nav
              className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2"
              aria-label="Navigasi utama"
            >
              <div className="flex items-center bg-slate-100/90 p-1.5 rounded-full border border-slate-200/80 shadow-sm gap-1">
                {NAV_LINKS.map(({ href, label }) => {
                  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "px-5 py-2 rounded-full text-sm font-bold font-nunito transition-all duration-150",
                        isActive
                          ? "bg-brand-pink text-white shadow-sm"
                          : "text-brand-dark-blue hover:text-brand-pink hover:bg-white"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* ── Right Actions: Cart Button + Mobile Menu ── */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              
              {/* Cart Button with Contrast Badge */}
              <Link
                href="/keranjang"
                className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-brand-pink hover:bg-brand-pink/90 active:scale-95 text-white shadow-pink-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark-blue"
                aria-label={`Keranjang belanja — ${totalItems} item`}
              >
                <ShoppingCart className="w-5 h-5 text-white" />
                {totalItems > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 bg-brand-yellow text-brand-dark-blue text-[10px] font-extrabold font-nunito rounded-full flex items-center justify-center ring-2 ring-white shadow-sm"
                    aria-live="polite"
                  >
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Link>

              {/* Mobile Hamburger Toggle Button */}
              <button
                type="button"
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-full text-brand-dark-blue hover:bg-pink-50 active:bg-pink-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
                onClick={() => setDrawerOpen(true)}
                aria-label="Buka menu navigasi"
                aria-expanded={drawerOpen}
              >
                <Menu className="w-6 h-6 text-brand-dark-blue" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        pathname={pathname}
      />
    </>
  );
}
