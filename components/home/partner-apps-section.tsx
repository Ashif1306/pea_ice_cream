"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, ExternalLink, ArrowRight } from "lucide-react";
import {
  fetchExternalApps,
  getStoredExternalApps,
} from "@/lib/supabase/services/settings";
import {
  DEFAULT_PARTNER_APPS,
  DeliveryAppItem,
  getAppVisual,
} from "@/components/home/apps-modal";

export function PartnerAppsSection() {
  const [apps, setApps] = useState<DeliveryAppItem[]>(DEFAULT_PARTNER_APPS);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setApps(getStoredExternalApps());

    fetchExternalApps().then((data) => {
      if (data && data.length > 0) {
        setApps(data);
      }
    });

    const handleAppsChanged = () => {
      setApps(getStoredExternalApps());
    };

    window.addEventListener("pea_apps_changed", handleAppsChanged);
    window.addEventListener("storage", handleAppsChanged);

    return () => {
      window.removeEventListener("pea_apps_changed", handleAppsChanged);
      window.removeEventListener("storage", handleAppsChanged);
    };
  }, []);

  const activeApps = (isClient ? apps : DEFAULT_PARTNER_APPS).filter(
    (a) => a.is_active !== false && a.url && a.url.trim().length > 0
  );

  const totalCards = 1 + activeApps.length;

  // Responsive grid based on card count to ensure balanced width without empty voids
  const gridLayoutClass =
    totalCards === 3
      ? "grid-cols-1 sm:grid-cols-3 max-w-4xl"
      : totalCards === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 max-w-6xl";

  return (
    <section className="container-brand py-12 sm:py-16">
      {/* Section Header */}
      <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
        <span className="text-xs font-bold font-nunito uppercase tracking-wider text-brand-pink block mb-1.5">
          Mitra Pemesanan Online
        </span>
        <h2 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue mb-2.5">
          Pesan Melalui Aplikasi Favoritmu
        </h2>
        <p className="text-slate-500 font-nunito text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
          Kamu dapat memesan langsung lewat website resmi kami atau melalui mitra aplikasi layanan pengiriman makanan favoritmu di Makassar.
        </p>
      </div>

      {/* Cards Grid */}
      <div className={`grid ${gridLayoutClass} gap-5 sm:gap-6 mx-auto items-stretch`}>
        {/* 1. Direct Website Order Card (Featured Card) */}
        <div className="bg-white rounded-3xl border-2 border-brand-pink/50 p-6 flex flex-col justify-between text-center shadow-pink-sm relative group hover:shadow-pink-md hover:-translate-y-1.5 transition-all duration-300">
          <div>
            {/* Top Badge Slot (Symmetrical with other cards) */}
            <div className="h-6 mb-2 flex items-center justify-center">
              <span className="bg-gradient-to-r from-brand-pink to-brand-pink-dark text-white text-[10px] sm:text-[11px] font-bold px-3 py-0.5 rounded-full shadow-2xs">
                Pilihan Terbaik
              </span>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-pink-100 flex items-center justify-center text-brand-pink mx-auto mb-3 group-hover:scale-105 transition-transform duration-200">
              <ShoppingBag className="w-8 h-8 text-brand-pink" />
            </div>

            <h3 className="font-fredoka text-lg sm:text-xl text-brand-dark-blue font-bold mb-1 group-hover:text-brand-pink transition-colors">
              Website Langsung
            </h3>

            <p className="text-xs text-slate-500 font-nunito leading-relaxed mb-5 min-h-[36px] flex items-center justify-center px-1">
              Pilih menu lengkap, atur kombinasi rasa scoop, dan dapatkan bebas ongkir ambil sendiri.
            </p>
          </div>

          <Link
            href="/katalog"
            className="w-full py-2.5 px-4 rounded-full bg-brand-pink hover:bg-brand-pink-dark text-white text-xs sm:text-sm font-bold font-nunito shadow-pink-sm hover:shadow-pink-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap mt-auto active:scale-95"
          >
            <span>Pesan di Sini</span>
            <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
          </Link>
        </div>

        {/* 2. Dynamic Partner App Cards (GoFood, GrabFood, ShopeeFood, Maxim, etc.) */}
        {activeApps.map((app) => {
          const visual = getAppVisual(app.name, app.icon);
          const badgeText = app.badge || visual.defaultBadge;

          return (
            <div
              key={app.id || app.name}
              className={`rounded-3xl border-2 p-6 flex flex-col justify-between text-center shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1.5 group relative ${visual.bgColor} ${visual.borderColor}`}
            >
              <div>
                {/* Top Badge Slot (Maintains exact vertical alignment across all cards) */}
                <div className="h-6 mb-2 flex items-center justify-center">
                  {badgeText ? (
                    <span
                      className={`text-[10px] sm:text-[11px] font-bold px-3 py-0.5 rounded-full shadow-2xs border border-black/5 ${visual.badgeColor}`}
                    >
                      {badgeText}
                    </span>
                  ) : (
                    <span className="invisible text-[10px] px-3 py-0.5 select-none">
                      Placeholder
                    </span>
                  )}
                </div>

                {/* Official / Uploaded Logo */}
                <div className="w-16 h-16 rounded-2xl bg-white shadow-xs p-2 flex items-center justify-center mx-auto mb-3 border border-black/5 overflow-hidden group-hover:scale-105 transition-transform duration-200">
                  {visual.logo ? (
                    <img
                      src={visual.logo}
                      alt={`Logo ${app.name}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="font-fredoka font-bold text-xl text-brand-dark-blue">
                      {app.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <h3 className="font-fredoka text-lg sm:text-xl text-brand-dark-blue font-bold mb-1 group-hover:text-slate-900 transition-colors">
                  {app.name}
                </h3>

                <p className="text-xs text-slate-500 font-nunito leading-relaxed mb-5 min-h-[36px] flex items-center justify-center px-1 line-clamp-2">
                  {app.description || `Pesan es krim Pea Ice Cream favoritmu lewat ${app.name}.`}
                </p>
              </div>

              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold font-nunito border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap mt-auto active:scale-95"
              >
                <span>Buka {app.name}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}
