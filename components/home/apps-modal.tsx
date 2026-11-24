"use client";

/**
 * components/home/apps-modal.tsx
 * Dialog modal (desktop) and Bottom Sheet (mobile) for "Pesan via Aplikasi".
 * Opens authentic partner outlet links (GrabFood, ShopeeFood, etc.) configured by admin.
 */

import React, { useEffect, useRef } from "react";
import { X, ExternalLink, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_PARTNER_APPS, DeliveryAppItem } from "@/lib/apps-data";
export { DEFAULT_PARTNER_APPS, type DeliveryAppItem };

interface AppsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apps: DeliveryAppItem[];
}

export function getAppVisual(name: string, icon?: string) {
  const n = (name || "").toLowerCase();
  if (n.includes("go") || n.includes("gofood")) {
    return {
      logo: icon || "/apps/gofood.svg",
      bgColor: "bg-red-50/60 hover:bg-red-50",
      borderColor: "border-red-200 hover:border-red-400",
      textColor: "text-red-700",
      badgeColor: "bg-red-100 text-red-700",
      defaultBadge: "Paling Populer",
    };
  }
  if (n.includes("grab")) {
    return {
      logo: icon || "/apps/grabfood.svg",
      bgColor: "bg-emerald-50/60 hover:bg-emerald-50",
      borderColor: "border-emerald-200 hover:border-emerald-400",
      textColor: "text-emerald-700",
      badgeColor: "bg-emerald-100 text-emerald-700",
      defaultBadge: "Banyak Promo",
    };
  }
  if (n.includes("shopee")) {
    return {
      logo: icon || "/apps/shopeefood.svg",
      bgColor: "bg-orange-50/60 hover:bg-orange-50",
      borderColor: "border-orange-200 hover:border-orange-400",
      textColor: "text-orange-700",
      badgeColor: "bg-orange-100 text-orange-700",
      defaultBadge: "Gratis Ongkir",
    };
  }
  if (n.includes("maxim")) {
    return {
      logo: icon || "/apps/maxim.svg",
      bgColor: "bg-amber-50/60 hover:bg-amber-50",
      borderColor: "border-amber-200 hover:border-amber-400",
      textColor: "text-amber-800",
      badgeColor: "bg-amber-100 text-amber-800",
      defaultBadge: "Hemat",
    };
  }
  return {
    logo: icon || null,
    bgColor: "bg-pink-50/60 hover:bg-pink-50",
    borderColor: "border-pink-200 hover:border-brand-pink",
    textColor: "text-brand-pink",
    badgeColor: "bg-pink-100 text-brand-pink",
    defaultBadge: undefined,
  };
}

export function AppsModal({ isOpen, onClose, apps }: AppsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const displayApps = apps && apps.length > 0 ? apps : DEFAULT_PARTNER_APPS;

  // Close on Escape key & trap focus
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apps-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-dark-blue/50 backdrop-blur-sm transition-opacity duration-200 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal / Bottom Sheet Panel */}
      <div
        ref={modalRef}
        className={cn(
          "relative w-full sm:max-w-md bg-white shadow-2xl",
          // Mobile: Bottom sheet rounded top
          "rounded-t-3xl sm:rounded-3xl border border-pink-100",
          "p-6 sm:p-8 flex flex-col max-h-[85vh] overflow-y-auto animate-scale-in z-10"
        )}
      >
        {/* Mobile handle indicator */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 flex items-center justify-center text-brand-pink flex-shrink-0">
              <Smartphone className="w-5 h-5 text-brand-pink" />
            </div>
            <div>
              <h3 id="apps-dialog-title" className="font-fredoka text-xl text-brand-dark-blue font-bold">
                Pesan via Aplikasi
              </h3>
              <p className="text-xs text-gray-500 font-nunito mt-0.5">
                Pilih aplikasi pesan antar makanan favoritmu:
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of active external delivery apps */}
        <div className="flex flex-col gap-3 my-2">
          {displayApps.map((app, idx) => {
            const visual = getAppVisual(app.name, app.icon);
            const badgeText = app.badge || visual.defaultBadge;

            return (
              <a
                key={app.id || idx}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border-2 transition-all group",
                  "hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
                  visual.bgColor,
                  visual.borderColor
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* App Official Logo / Icon */}
                  <div className="w-11 h-11 rounded-xl bg-white shadow-xs p-1 flex items-center justify-center flex-shrink-0 overflow-hidden border border-black/5">
                    {visual.logo ? (
                      <img
                        src={visual.logo}
                        alt={`Logo ${app.name}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="font-fredoka font-bold text-base text-brand-dark-blue">
                        {app.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-fredoka text-base block font-bold text-brand-dark-blue truncate">
                        {app.name}
                      </span>
                      {badgeText && (
                        <span className={cn("text-[9px] font-bold font-nunito px-2 py-0.5 rounded-full", visual.badgeColor)}>
                          {badgeText}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] opacity-80 font-nunito font-semibold block truncate">
                      {app.description || "Buka outlet Pea Ice Cream"}
                    </span>
                  </div>
                </div>

                <div className={cn("flex items-center gap-1 text-xs font-bold font-nunito group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-2", visual.textColor)}>
                  <span>Pesan</span>
                  <ExternalLink className="w-4 h-4" />
                </div>
              </a>
            );
          })}
        </div>

        {/* Footer info note */}
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400 font-nunito">
            Pesanan akan diproses dan dikirim langsung oleh kurir mitra aplikasi.
          </p>
        </div>
      </div>
    </div>
  );
}
