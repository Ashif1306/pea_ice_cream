"use client";

/**
 * components/layout/footer.tsx
 * Dynamic, responsive footer for Pea Ice Cream.
 * Visible on all screen sizes (mobile & desktop).
 * Fully dynamic: loads store profile, WhatsApp, social media, and outlet locations from admin settings.
 */

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  StoreProfileData,
  getStoredStoreProfile,
  fetchStoreProfile,
  getWhatsAppLink,
  getInstagramLink,
  getTikTokLink,
} from "@/lib/supabase/services/settings";
import {
  OutletLocation,
  getStoredOutlets,
  getOutletStatus,
} from "@/lib/outlets-data";
import { IceCreamDecoration } from "@/components/ui/ice-cream-decoration";
import { MapPin, Clock, Mail, MessageCircle, ExternalLink, ArrowRight } from "lucide-react";

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.535 5.874L.057 23.5l5.787-1.517A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.985 0-3.842-.544-5.44-1.49l-.389-.23-4.034 1.057 1.077-3.934-.254-.404A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.87-4.49V8.65a8.28 8.28 0 0 0 4.9 1.59v-3.55z" />
    </svg>
  );
}

// ─── Footer Component ────────────────────────────────────────────────────────

export function Footer() {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  const [profile, setProfile] = useState<StoreProfileData>(() => getStoredStoreProfile());
  const [outlets, setOutlets] = useState<OutletLocation[]>(() => getStoredOutlets());

  useEffect(() => {
    // 1. Initial async load from server API
    fetchStoreProfile().then((data) => {
      if (data) setProfile(data);
    });

    const handleProfileChange = () => {
      setProfile(getStoredStoreProfile());
    };

    const handleOutletsChange = () => {
      setOutlets(getStoredOutlets());
    };

    window.addEventListener("pea_profile_changed", handleProfileChange);
    window.addEventListener("pea_outlets_changed", handleOutletsChange);

    return () => {
      window.removeEventListener("pea_profile_changed", handleProfileChange);
      window.removeEventListener("pea_outlets_changed", handleOutletsChange);
    };
  }, []);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const waLink = getWhatsAppLink(profile.whatsappNumber, profile.whatsappMessage);
  const igLink = getInstagramLink(profile.instagram);
  const tiktokLink = getTikTokLink(profile.tiktok || "@pea.icecream");

  const mainStore = outlets.find((o) => o.type === "main");
  const branchOutlets = outlets.filter((o) => o.type !== "main" && o.isActive !== false);

  return (
    <footer
      className="mt-auto bg-gradient-to-b from-white via-pink-50/30 to-pink-100/40 border-t border-pink-100/80 pb-28 md:pb-12 pt-12 text-slate-700 relative overflow-hidden"
      aria-label="Footer Pea Ice Cream"
    >
      {/* Decorative background circle */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-pink/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="container-brand relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* ─── Column 1: Brand & Sosial Media ─────────────────────── */}
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="flex items-center gap-3 w-fit group"
              aria-label="Pea Ice Cream — Ke Halaman Utama"
            >
              <div
                className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-brand-pink/30 group-hover:ring-brand-pink group-hover:scale-105 transition-all flex-shrink-0 bg-white shadow-sm"
                style={{ width: "44px", height: "44px" }}
              >
                <Image
                  src={profile.logoUrl || "/logo.jpg"}
                  alt="Logo Pea Ice Cream"
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                  style={{ width: "44px", height: "44px", objectFit: "cover" }}
                />
              </div>
              <div className="flex flex-col">
                <span className="font-fredoka text-xl text-gradient-pink font-semibold leading-tight">
                  {profile.businessName || "pea ice cream"}
                </span>
                <span className="text-[11px] text-brand-dark-blue/70 font-nunito font-semibold tracking-wide">
                  {profile.tagline1} • {profile.tagline2}
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-slate-500 font-nunito leading-relaxed">
              {profile.description ||
                "Es krim artisan premium buatan tangan di Makassar. Menghadirkan rasa manis pas yang segar dan sehat untuk keluarga tercinta."}
            </p>

            {/* Social Media Pills */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {/* Instagram */}
              <a
                href={igLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white text-xs font-bold font-nunito hover:shadow-md hover:scale-105 transition-all duration-150"
                aria-label={`Instagram ${profile.instagram || "@pea.icecream"}`}
              >
                <InstagramIcon />
                <span>{profile.instagram || "@pea.icecream"}</span>
              </a>

              {/* TikTok */}
              <a
                href={tiktokLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold font-nunito hover:bg-black hover:shadow-md hover:scale-105 transition-all duration-150"
                aria-label={`TikTok ${profile.tiktok || "@pea.icecream"}`}
              >
                <TikTokIcon />
                <span>{profile.tiktok || "@pea.icecream"}</span>
              </a>
            </div>

            {/* Decorative Ice Cream Figures */}
            <div className="flex items-center gap-2 pt-2" aria-hidden="true">
              <IceCreamDecoration variant="scoop" size={36} animationClass="animate-bounce-soft" ariaLabel="" />
              <IceCreamDecoration variant="cone" size={36} animationClass="animate-bounce-soft [animation-delay:0.3s]" ariaLabel="" />
              <IceCreamDecoration variant="popsicle" size={36} animationClass="animate-bounce-soft [animation-delay:0.6s]" ariaLabel="" />
              <span className="text-[11px] text-pink-500 font-fredoka ml-1 font-medium">100% Homemade Makassar</span>
            </div>
          </div>

          {/* ─── Column 2: Navigasi Cepat ───────────────────────────── */}
          <div className="flex flex-col gap-3">
            <h3 className="font-fredoka text-base text-brand-dark-blue tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-pink" />
              <span>Navigasi Menu</span>
            </h3>
            <nav aria-label="Tautan Navigasi Footer">
              <ul className="flex flex-col gap-2.5">
                {[
                  { href: "/", label: "Beranda Utama" },
                  { href: "/katalog", label: "Katalog & Pilihan Rasa" },
                  { href: "/tentang", label: "Tentang Pea Ice Cream" },
                  { href: "/pesanan", label: "Cek Status Pesanan Saya" },
                  { href: "/admin", label: "Admin Panel Toko", badge: "Kelola" },
                ].map(({ href, label, badge }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-xs sm:text-sm font-nunito text-slate-600 hover:text-brand-pink transition-colors duration-150 flex items-center justify-between group py-0.5"
                    >
                      <span className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                        <span className="text-brand-pink/50 group-hover:text-brand-pink text-xs">›</span>
                        {label}
                      </span>
                      {badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-brand-pink group-hover:bg-brand-pink group-hover:text-white transition-colors">
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* ─── Column 3: Toko & Outlet Makassar ───────────────────── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-fredoka text-base text-brand-dark-blue tracking-wide flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-pink" />
                <span>Outlet di Makassar</span>
              </h3>
              <span className="text-[10px] font-bold text-brand-pink bg-pink-100 px-2 py-0.5 rounded-full">
                {outlets.length} Titik
              </span>
            </div>

            <div className="flex flex-col gap-2.5 text-xs font-nunito">
              {/* Main Store */}
              <div className="p-2.5 rounded-xl bg-white/80 border border-pink-200/60 shadow-xs">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-pink" />
                    <span>Main Store Pusat</span>
                  </span>
                  {(() => {
                    const st = getOutletStatus(mainStore || { type: "main", openTime: "10:00", closeTime: "18:00" });
                    return (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${st.badgeBg} ${st.badgeTextColor}`}>
                        {st.statusText}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  {mainStore?.address || profile.address || "Jl. Sungai Kelara 38, Makassar"}
                </p>
                <div className="text-[10px] text-amber-700 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>{mainStore?.hours || "Everyday 10.00 – 18.00 WITA"}</span>
                </div>
              </div>

              {/* Branch Outlets Highlights */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Booth Mall Makassar:
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {branchOutlets.slice(0, 4).map((outlet) => {
                    const st = getOutletStatus(outlet);
                    return (
                      <div
                        key={outlet.id}
                        className="flex items-center justify-between py-1 px-2 rounded-lg bg-white/50 border border-slate-100 hover:bg-white transition-colors"
                      >
                        <div className="truncate mr-2">
                          <span className="font-semibold text-slate-700 text-[11px] block truncate">
                            {outlet.name}
                          </span>
                          {outlet.detailLocation && (
                            <span className="text-[10px] text-slate-400 block truncate">
                              {outlet.detailLocation}
                            </span>
                          )}
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${st.badgeBg} ${st.badgeTextColor}`}>
                          {st.statusText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Column 4: Kontak & WhatsApp Pesan Langsung ─────────── */}
          <div className="flex flex-col gap-3">
            <h3 className="font-fredoka text-base text-brand-dark-blue tracking-wide flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              <span>Pesan & Bantuan</span>
            </h3>

            {/* WhatsApp Big CTA Card */}
            <div className="bg-white p-3.5 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>WhatsApp Bisnis</span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-nunito leading-snug">
                Pesan langsung atau tanya ketersediaan stok rasa via WhatsApp admin kami:
              </p>
              <span className="font-fredoka text-base text-emerald-700 tracking-wide font-medium">
                {profile.whatsappNumber || "081234567890"}
              </span>

              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold font-nunito flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <WhatsAppIcon />
                <span>Chat WhatsApp Sekarang</span>
                <ExternalLink className="w-3.5 h-3.5 ml-auto" />
              </a>
            </div>

            {/* Jam Operasional & Email */}
            <div className="flex flex-col gap-1.5 text-xs font-nunito text-slate-500 pt-1">
              {profile.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <a href={`mailto:${profile.email}`} className="hover:text-brand-pink transition-colors truncate">
                    {profile.email}
                  </a>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                <span className="text-[11px] leading-tight">
                  Jam Layanan: Everyday 10.00 – 18.00 WITA (Main Store) • 10.00 – 22.00 WITA (Mall)
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ─── Bottom Copyright Bar ───────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-nunito text-slate-400">
          <p className="text-center sm:text-left">
            © {year} <span className="font-semibold text-slate-600">{profile.businessName || "Pea Ice Cream"}</span> Makassar. All rights reserved.
          </p>

          <div className="flex items-center gap-4 flex-wrap justify-center text-[11px]">
            <span className="inline-flex items-center gap-1 text-slate-500">
              <span className="text-rose-500">❤️</span> Dibuat di Makassar
            </span>
            <span>•</span>
            <span className="text-slate-500">Artisan Homemade Gelato & Ice Cream</span>
            <span>•</span>
            <Link
              href="/admin/profil"
              className="text-brand-pink hover:underline font-semibold flex items-center gap-1"
            >
              <span>Atur Profil & Kontak</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
