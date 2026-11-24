"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  ClipboardList,
  Store,
  Truck,
  CreditCard,
  Share2,
  UserCheck,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  ExternalLink,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

const ADMIN_NAV = [
  { href: "/admin", label: "Ringkasan Operasional", icon: LayoutDashboard },
  { href: "/admin/banner", label: "Banner Beranda", icon: SlidersHorizontal },
  { href: "/admin/pesanan", label: "Pesanan Masuk", icon: ClipboardList },
  { href: "/admin/stok", label: "Kelola Stok", icon: Layers },
  { href: "/admin/produk", label: "Produk & Menu", icon: Package },
  { href: "/admin/rasa", label: "Pilihan Rasa", icon: Sparkles },
  { href: "/admin/profil", label: "Profil Usaha", icon: Store },
  { href: "/admin/pengiriman", label: "Area & Ongkir", icon: Truck },
  { href: "/admin/pembayaran", label: "Rekening & QRIS", icon: CreditCard },
  { href: "/admin/aplikasi", label: "Tautan Aplikasi", icon: Share2 },
  { href: "/admin/akun", label: "Akun Admin", icon: UserCheck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If on login page, don't show the dashboard shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Logout error:", e);
    }
    localStorage.removeItem("pea_admin_token");
    router.push("/admin/login");
  };

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col font-nunito"
      style={{ fontFamily: '"Nunito", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
    >
      {/* ─── Top Database & Auth Status Banner ──────────────────── */}
      <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse flex-shrink-0" />
          <span>
            <strong>Integrasi Supabase Aktif:</strong> Database PostgreSQL, RLS, Storage Bucket <code>pea-assets</code>, dan Autentikasi Admin siap digunakan.
          </span>
        </div>
        <Link
          href="/"
          className="text-[11px] underline ml-2 flex-shrink-0 text-white font-bold hover:text-emerald-100"
        >
          Lihat Website Pelanggan ↗
        </Link>
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* ─── Desktop Sidebar ─────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-4 sticky top-8 h-[calc(100vh-2rem)]">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 px-2 py-3 mb-4 border-b border-slate-100">
            <div
              className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-brand-pink/30 flex-shrink-0"
              style={{ width: "36px", height: "36px", minWidth: "36px", minHeight: "36px" }}
            >
              <Image
                src="/logo.jpg"
                alt="Logo Pea Ice Cream"
                width={36}
                height={36}
                className="w-full h-full object-cover"
                style={{ width: "36px", height: "36px", objectFit: "cover" }}
              />
            </div>
            <div>
              <span className="font-fredoka text-base text-brand-dark-blue block leading-tight">
                pea ice cream
              </span>
              <span className="text-[10px] text-brand-pink font-bold uppercase tracking-wider">
                Admin Panel
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-brand-pink text-white shadow-pink-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-brand-dark-blue"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout / Back */}
          <div className="pt-3 border-t border-slate-100 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-500 hover:bg-slate-100 hover:text-brand-pink transition-colors font-semibold"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka Toko Pelanggan</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-500 hover:bg-red-50 transition-colors font-semibold text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Demo</span>
            </button>
          </div>
        </aside>

        {/* ─── Mobile Header ───────────────────────────────────────── */}
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-8 z-40">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-brand-pink/30 flex-shrink-0"
              style={{ width: "32px", height: "32px", minWidth: "32px", minHeight: "32px" }}
            >
              <Image
                src="/logo.jpg"
                alt="Logo Pea Ice Cream"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                style={{ width: "32px", height: "32px", objectFit: "cover" }}
              />
            </div>
            <div>
              <span className="font-fredoka text-sm text-brand-dark-blue block leading-tight">
                pea ice cream
              </span>
              <span className="text-[9px] text-brand-pink font-bold uppercase">
                Admin Panel
              </span>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* ─── Mobile Drawer Menu ──────────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex">
            <div className="w-64 bg-white h-full p-4 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <span className="font-fredoka text-base text-brand-pink">Menu Admin</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {ADMIN_NAV.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname?.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? "bg-brand-pink text-white shadow-pink-sm"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1">
                <Link
                  href="/"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka Toko Pelanggan</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-500 hover:bg-red-50 font-semibold text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Demo</span>
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* ─── Main Content Area ───────────────────────────────────── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
