"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  ShoppingBag,
  ExternalLink,
  Store,
  Navigation,
} from "lucide-react";
import {
  DEFAULT_OUTLETS,
  OutletLocation,
  getStoredOutlets,
  getOutletStatus,
} from "@/lib/outlets-data";

export function OutletsSection() {
  const [outlets, setOutlets] = useState<OutletLocation[]>(DEFAULT_OUTLETS);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setOutlets(getStoredOutlets());

    const handleStorageChange = () => {
      setOutlets(getStoredOutlets());
    };

    window.addEventListener("pea_outlets_changed", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    // Update real-time clock every 30 seconds so opening/closing switches seamlessly
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => {
      window.removeEventListener("pea_outlets_changed", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(timer);
    };
  }, []);

  const mainOutlet =
    outlets.find((o) => o.type === "main" && o.isActive !== false) ||
    DEFAULT_OUTLETS[0];

  const branchOutlets = outlets.filter(
    (o) => o.type === "branch" && o.isActive !== false
  );

  const mainStatus = isClient
    ? getOutletStatus(mainOutlet, currentTime)
    : getOutletStatus(mainOutlet, new Date());

  return (
    <section className="container-brand pb-12 sm:pb-16">
      <div className="bg-gradient-to-br from-pink-500 via-brand-pink to-brand-pink-dark rounded-3xl p-6 sm:p-10 text-white shadow-pink-md">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <span className="px-3.5 py-1 rounded-full bg-white/20 text-xs font-bold font-nunito tracking-wider uppercase inline-block mb-3 backdrop-blur-xs">
            VISIT US AT MAKASSAR
          </span>
          <h2 className="font-fredoka text-2xl sm:text-4xl text-white mb-2">
            Lokasi Main Store & {branchOutlets.length} Outlet Kami
          </h2>
          <p className="text-xs sm:text-sm text-pink-100 font-nunito leading-relaxed">
            Nikmati kelezatan es krim homemade Pea Ice Cream langsung di Main Store kami atau kunjungi outlet booth resmi kami di mall-mall favorit Makassar.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* 1. Main Store Highlight Card (Featured) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 text-brand-dark-blue shadow-lg border border-pink-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-brand-pink text-white text-[11px] font-bold font-nunito shadow-xs">
                  Main Store Pusat
                </span>
                
                {/* Dynamic Real-time Status Badge */}
                <div
                  className={`flex items-center gap-1.5 text-[11px] font-bold font-nunito px-2.5 py-1 rounded-full border transition-colors ${mainStatus.badgeBg} ${mainStatus.badgeTextColor}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${mainStatus.dotColor} ${
                      mainStatus.isOpen ? "animate-pulse" : ""
                    }`}
                  />
                  <span>{mainStatus.isOpen ? "Sedang Buka" : "Sedang Tutup"}</span>
                  <span className="text-[10px] font-normal opacity-85 hidden sm:inline">
                    • {mainStatus.timeNote}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-pink-100 flex items-center justify-center text-brand-pink flex-shrink-0">
                  <Store className="w-5 h-5 text-brand-pink" />
                </div>
                <div>
                  <h3 className="font-fredoka text-xl text-brand-dark-blue font-bold">
                    {mainOutlet.name.includes("Pea Ice Cream") ? mainOutlet.name : `Pea Ice Cream ${mainOutlet.name}`}
                  </h3>
                  <p className="text-xs text-slate-500 font-nunito mt-0.5 font-semibold">
                    {mainOutlet.detailLocation || "Toko Pusat Produksi & Dine-in"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 py-3 border-y border-slate-100 font-nunito text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-brand-pink flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-800 text-sm">
                      {mainOutlet.address}
                    </strong>
                    <span>{mainOutlet.city || "Kota Makassar, Sulawesi Selatan"}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-800">Jam Operasional:</strong>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-brand-dark-blue">
                        {mainOutlet.hours}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                      Status: <strong className={mainStatus.isOpen ? "text-emerald-600" : "text-rose-600"}>{mainStatus.isOpen ? "Buka Sekarang" : "Tutup"}</strong> ({mainStatus.timeNote})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-4 flex flex-col sm:flex-row gap-2.5">
              <a
                href={mainOutlet.googleMapsUrl || "https://maps.google.com/?q=Jl.+Sungai+Kelara+38+Makassar"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 rounded-xl bg-pink-50 hover:bg-pink-100 text-brand-pink font-bold font-nunito text-xs text-center border border-pink-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Petunjuk Arah (Maps)</span>
              </a>
              <Link
                href="/katalog"
                className="flex-1 py-2.5 px-4 rounded-xl bg-brand-pink hover:bg-brand-pink-dark text-white font-bold font-nunito text-xs text-center shadow-pink-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Pesan Sekarang</span>
              </Link>
            </div>
          </div>

          {/* 2. Grid of Mall Outlets */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="font-fredoka text-sm text-pink-100 font-bold uppercase tracking-wide">
                Outlet & Booth Mall Makassar:
              </span>
              <span className="text-[11px] font-nunito text-pink-200">
                {branchOutlets.length} Lokasi Aktif
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {branchOutlets.map((outlet) => {
                const status = isClient
                  ? getOutletStatus(outlet, currentTime)
                  : getOutletStatus(outlet, new Date());

                return (
                  <div
                    key={outlet.id}
                    className="bg-white/95 backdrop-blur-xs rounded-2xl p-4 text-brand-dark-blue shadow-sm border border-white/40 hover:bg-white hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-pink-100 text-brand-pink text-[9px] font-bold font-nunito">
                          Outlet Mall
                        </span>
                        
                        {/* Real-time Dynamic Operational Badge */}
                        <div
                          className={`flex items-center gap-1 text-[10px] font-bold font-nunito px-2 py-0.5 rounded-full border transition-colors ${status.badgeBg} ${status.badgeTextColor}`}
                          title={`Waktu Saat Ini: ${status.currentTimeString} WITA • ${status.timeNote}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${status.dotColor} ${
                              status.isOpen ? "animate-pulse" : ""
                            }`}
                          />
                          <span>{status.statusText}</span>
                          <span className="text-[9px] font-normal opacity-85">
                            ({status.isOpen ? `Tutup ${(outlet.closeTime || "22:00").replace(":", ".")}` : `Buka ${(outlet.openTime || "10:00").replace(":", ".")}`})
                          </span>
                        </div>
                      </div>

                      <h4 className="font-fredoka text-base text-brand-dark-blue font-bold group-hover:text-brand-pink transition-colors">
                        {outlet.name}
                      </h4>

                      {outlet.detailLocation && (
                        <p className="text-xs text-brand-pink font-semibold font-nunito mt-0.5">
                          {outlet.detailLocation}
                        </p>
                      )}

                      <p className="text-[11px] text-slate-500 font-nunito mt-1 line-clamp-1">
                        {outlet.address}
                      </p>
                    </div>

                    <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-nunito text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-semibold text-slate-700">
                          {outlet.hours ? outlet.hours.replace("Everyday ", "").replace("Setiap Hari: ", "") : "10.00 – 22.00 WITA"}
                        </span>
                      </div>
                      <a
                        href={outlet.googleMapsUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-brand-pink hover:underline flex items-center gap-0.5"
                      >
                        <span>Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/20 text-center text-xs text-pink-50 font-nunito flex items-center justify-between px-4">
              <span>Pesanan ambil sendiri (Pick Up) bebas biaya pengiriman di seluruh titik outlet.</span>
              <Link
                href="/katalog"
                className="text-white font-bold underline hover:text-pink-100 text-xs flex items-center gap-1"
              >
                <span>Pilih Menu</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
