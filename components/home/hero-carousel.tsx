"use client";

/**
 * components/home/hero-carousel.tsx
 * 
 * Revised Pea Ice Cream Hero:
 * - Clean hero stage with no visual carousel controls (no buttons, no dots)
 * - Automatic slide rotation driven by admin settings in Supabase
 * - Pure product cutouts without background cards or boxes
 * - Lower, smoother melting wave with no awkward oval bumps
 * - Buttons: "Pesan Sekarang" -> /katalog, "Pesan via Aplikasi" -> AppsModal
 * - Single neat label pill
 * - Smooth physical object transitions with drop-down exit and scale-up entrance
 * - Respects system prefers-reduced-motion
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  BannerSlide,
  INITIAL_BANNERS,
  CarouselAnimationSettings,
  DEFAULT_CAROUSEL_SETTINGS,
  getStoredCarouselSettings,
  COLOR_PRESETS,
  getHeroGradient,
} from "@/lib/banners-data";
import { fetchActiveBanners, fetchCarouselSettings } from "@/lib/supabase/services/banners";
import { fetchExternalApps, getStoredExternalApps } from "@/lib/supabase/services/settings";
import { ShoppingBag, Smartphone, ArrowRight } from "lucide-react";
import { AppsModal, DeliveryAppItem } from "@/components/home/apps-modal";
import { HeroBottomDivider } from "@/components/home/hero-dividers";

// ─── Color Themes (Preset Palettes & Custom Hex Color Support) ─────

interface ThemeConfig {
  bgGradient: string;
  waveColor: string;
}

const THEMES: Record<string, ThemeConfig> = {
  pink: {
    bgGradient: "linear-gradient(135deg, #FF6B9D 0%, #FF85B1 50%, #FFA1C5 100%)",
    waveColor: "#FFF6D6", // Soft natural vanilla cream
  },
  yellow: {
    bgGradient: "linear-gradient(135deg, #F5B738 0%, #F8C659 50%, #FCE08B 100%)",
    waveColor: "#FFFFFF",
  },
  blue: {
    bgGradient: "linear-gradient(135deg, #4A90E2 0%, #68A4EA 50%, #90BEF5 100%)",
    waveColor: "#FFF6D6",
  },
  green: {
    bgGradient: "linear-gradient(135deg, #43A047 0%, #57B65B 50%, #81C784 100%)",
    waveColor: "#FFF6D6",
  },
  purple: {
    bgGradient: "linear-gradient(135deg, #9B51E0 0%, #B06CE8 50%, #C78EF2 100%)",
    waveColor: "#FFF6D6",
  },
  peach: {
    bgGradient: "linear-gradient(135deg, #FF7F50 0%, #FF9770 50%, #FFB194 100%)",
    waveColor: "#FFF6D6",
  },
  pandan: {
    bgGradient: "linear-gradient(135deg, #2E7D32 0%, #388E3C 50%, #4CAF50 100%)",
    waveColor: "#FFF6D6",
  },
  caramel: {
    bgGradient: "linear-gradient(135deg, #8D6E63 0%, #A1887F 50%, #BCAAA4 100%)",
    waveColor: "#FFF6D6",
  },
};

function getTheme(themeName?: string): ThemeConfig {
  if (!themeName) return THEMES.pink;
  if (THEMES[themeName]) return THEMES[themeName];

  // If custom hex code or custom preset, generate smooth gradient
  return {
    bgGradient: getHeroGradient(themeName),
    waveColor: "#FFF6D6",
  };
}

// ─── Main Hero Component ─────────────────────────────────────────────────────

interface HeroCarouselProps {
  initialBanners?: BannerSlide[];
}

export function HeroCarousel({ initialBanners }: HeroCarouselProps = {}) {
  const [banners, setBanners] = useState<BannerSlide[]>(
    initialBanners && initialBanners.length > 0 ? initialBanners : INITIAL_BANNERS
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  // Settings from Admin
  const [settings, setSettings] = useState<CarouselAnimationSettings>(DEFAULT_CAROUSEL_SETTINGS);

  // Active external delivery apps (GrabFood, ShopeeFood, etc.)
  const [activeApps, setActiveApps] = useState<DeliveryAppItem[]>([]);
  const [isAppsModalOpen, setIsAppsModalOpen] = useState(false);

  // Animation transition state: "idle" | "forward"
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [exitingIndex, setExitingIndex] = useState<number | null>(null);
  const [justResetIndex, setJustResetIndex] = useState<number | null>(null);

  // Tab visibility state (pause only when browser tab is hidden to save CPU/battery)
  const [isTabVisible, setIsTabVisible] = useState(true);

  // Refs for touch swipe and interval cleanup
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── 1. Load Banners, Settings, and Partner Apps ───────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [bannerList, animSettings, deliveryApps] = await Promise.all([
        fetchActiveBanners(),
        fetchCarouselSettings(),
        fetchExternalApps(),
      ]);

      if (bannerList && bannerList.length > 0) {
        setBanners(bannerList);
      }
      if (animSettings) {
        setSettings({
          autoplay: animSettings.autoplay !== false,
          intervalSeconds: animSettings.intervalSeconds || 6,
          transitionMs: animSettings.transitionMs || 1200,
          bottomEffect: animSettings.bottomEffect || "melting-wave",
        });
      }
      if (deliveryApps) {
        const valid = deliveryApps.filter((a: any) => a.url && a.url.trim().length > 0);
        setActiveApps(valid);
      }
    } catch {
      setSettings(getStoredCarouselSettings());
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleCustomEvents = () => loadData();
    const handleAppsUpdate = () => {
      const stored = getStoredExternalApps();
      setActiveApps(stored.filter((a) => a.url && a.url.trim().length > 0));
    };

    window.addEventListener("pea_banners_changed", handleCustomEvents);
    window.addEventListener("pea_carousel_settings_changed", handleCustomEvents);
    window.addEventListener("pea_apps_changed", handleAppsUpdate);

    return () => {
      window.removeEventListener("pea_banners_changed", handleCustomEvents);
      window.removeEventListener("pea_carousel_settings_changed", handleCustomEvents);
      window.removeEventListener("pea_apps_changed", handleAppsUpdate);
    };
  }, [loadData]);

  // ─── 2. Page Visibility Detection ──────────────────────────────────────────
  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleVisibility = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const totalSlides = banners.length;

  // ─── 3. Slide Transition (Forward / Backward) ──────────────────────────────
  const advanceSlide = useCallback((direction: "forward" | "backward" = "forward") => {
    const len = banners.length;
    if (len <= 1) return;

    setJustResetIndex(null);

    let fromIdx = 0;
    setCurrentIndex((prev) => {
      fromIdx = prev;
      const next = direction === "forward" ? (prev + 1) % len : (prev - 1 + len) % len;
      setExitingIndex(prev);
      setIsTransitioning(true);
      return next;
    });

    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = setTimeout(() => {
      setIsTransitioning(false);
      setJustResetIndex(fromIdx);
      setExitingIndex(null);

      setTimeout(() => {
        setJustResetIndex(null);
      }, 70);
    }, settings.transitionMs || 1200);
  }, [banners.length, settings.transitionMs]);

  // ─── 4. Rock-Solid Autoplay Timer Loop ─────────────────────────────────────
  useEffect(() => {
    if (banners.length <= 1) return;
    if (settings.autoplay === false) return;
    if (!isTabVisible) return;

    const intervalMs = Math.max(3000, (settings.intervalSeconds || 6) * 1000);
    const timer = setInterval(() => {
      advanceSlide("forward");
    }, intervalMs);

    return () => clearInterval(timer);
  }, [banners.length, settings.autoplay, settings.intervalSeconds, isTabVisible, advanceSlide]);

  // ─── 5. Mobile Touch Swipe (No visual controls) ────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchStartYRef.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const deltaX = touchStartXRef.current - endX;
    const deltaY = touchStartYRef.current - endY;

    // Horizontal swipe threshold (doesn't interfere with vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        advanceSlide("forward");
      } else {
        advanceSlide("backward");
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // ─── Active Slide & Product Slots ──────────────────────────────────────────
  const activeSlide = banners[currentIndex] || banners[0];
  const currentTheme = getTheme(activeSlide?.bgTheme);

  // ─── Continuous Physical Carousel CSS Classes ─────────────────────────────
  const getSlideClass = (i: number): string => {
    // 1. If this slide was in main and is currently dropping down
    if (isTransitioning && i === exitingIndex) {
      return "carousel-cup cup-slot-exited";
    }

    // 2. If this slide just finished dropping down and is silently resetting to offscreen right
    if (i === justResetIndex) {
      return "carousel-cup-instant cup-slot-offscreen";
    }

    // 3. Compute relative slot position offset from currentIndex
    const offset = (i - currentIndex + totalSlides) % totalSlides;

    if (offset === 0) return "carousel-cup cup-slot-main";
    if (offset === 1) return "carousel-cup cup-slot-secondary";
    if (offset === 2) return "carousel-cup cup-slot-tertiary";
    return "carousel-cup cup-slot-offscreen";
  };

  return (
    <>
      <div className="max-w-[1300px] 2xl:max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 w-full">
        <section
          className="relative overflow-hidden w-full rounded-2xl sm:rounded-3xl shadow-lg select-none transition-colors duration-700 ease-in-out border border-white/40 flex flex-col justify-between"
          style={{
            background: currentTheme.bgGradient,
            minHeight: "clamp(540px, 72vh, 670px)",
          }}
          aria-label="Pea Ice Cream Hero Produk"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute top-1/4 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />

          {/* ── Main Hero Content ── */}
          <div className="relative z-10 w-full px-6 sm:px-8 lg:px-11 xl:px-14 py-9 sm:py-12 pb-14 sm:pb-18 flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">

              {/* ════════ SISI KIRI: Area Teks (~48–50%) ════════ */}
              <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left z-30 order-2 lg:order-1">
                
                {/* Single Clean Label Pill */}
                <div className="mb-4">
                  <span className="px-4 py-1.5 rounded-full bg-white/25 backdrop-blur-md text-white text-xs sm:text-sm font-bold font-nunito border border-white/30 shadow-xs inline-flex items-center gap-1.5 transition-all duration-300">
                    <span>{activeSlide.badge || "Pea Ice Cream"}</span>
                    {activeSlide.flavorLabel && (
                      <>
                        <span className="text-white/60">•</span>
                        <span
                          key={`flavor-${activeSlide.id}`}
                          className="text-brand-yellow font-extrabold animate-in fade-in duration-300"
                        >
                          {activeSlide.flavorLabel}
                        </span>
                      </>
                    )}
                  </span>
                </div>

                {/* Headline: Kelembutan yang menyatu dengan manis yang pas. */}
                <h1 className="font-fredoka text-3xl sm:text-5xl lg:text-[3.15rem] xl:text-[3.5rem] font-bold text-white leading-[1.12] tracking-tight mb-4 sm:mb-5 max-w-xl drop-shadow-sm">
                  {activeSlide.title || "Kelembutan yang menyatu dengan manis yang pas."}
                </h1>

                {/* Subheadline: Sajian es krim dengan cita rasa seimbang yang selalu tepat dinikmati kapan saja. */}
                <p className="text-white/95 font-nunito text-sm sm:text-base lg:text-lg xl:text-xl leading-relaxed mb-7 sm:mb-8 max-w-lg">
                  {activeSlide.subtitle || "Sajian es krim dengan cita rasa seimbang yang selalu tepat dinikmati kapan saja."}
                </p>

                {/* Action Buttons: "Pesan Sekarang" & "Pesan via Aplikasi" (Selalu Muncul + Animasi) */}
                <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
                  {/* Button 1: Pesan Sekarang -> Katalog (Animated Glow + Shimmer + Hover Elevation) */}
                  <Link
                    href={activeSlide.ctaLink || "/katalog"}
                    className="hero-btn-primary w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full bg-brand-dark-blue hover:bg-brand-dark-blue/90 text-white font-nunito font-bold text-base sm:text-lg shadow-md hover:shadow-xl hover:shadow-brand-dark-blue/35 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2.5 group select-none"
                  >
                    <div className="btn-shimmer-sweep" aria-hidden="true" />
                    <ShoppingBag className="w-5 h-5 text-brand-yellow group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 relative z-10" />
                    <span className="relative z-10">{activeSlide.ctaText || "Pesan Sekarang"}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300 relative z-10" />
                  </Link>

                  {/* Button 2: Pesan via Aplikasi (Selalu Muncul + Floating + Hover Shine) */}
                  <button
                    type="button"
                    onClick={() => setIsAppsModalOpen(true)}
                    className="hero-btn-secondary w-full sm:w-auto px-7 py-3.5 sm:py-4 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-md border border-white/40 hover:border-white/70 text-white font-nunito font-bold text-base sm:text-lg shadow-xs hover:shadow-md hover:shadow-white/25 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group select-none"
                  >
                    <div className="btn-shimmer-sweep" style={{ animationDelay: "2s" }} aria-hidden="true" />
                    <Smartphone className="w-5 h-5 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300 relative z-10" />
                    <span className="relative z-10">Pesan via Aplikasi</span>
                  </button>
                </div>
              </div>

              {/* ════════ SISI KANAN: Panggung Produk Cutout (~50–52%) ════════ */}
              <div className="lg:col-span-6 flex items-center justify-center order-1 lg:order-2 relative w-full h-[300px] sm:h-[390px] lg:h-[450px] xl:h-[490px]">
                
                {/* Pure Cutout Stage with Continuous Physical Sliding Motion */}
                <div className="relative w-full h-full max-w-[480px] sm:max-w-[560px] lg:max-w-[620px]">
                  {banners.map((slide, i) => {
                    const cls = getSlideClass(i);
                    const isMain = i === currentIndex;
                    return (
                      <div
                        key={slide.id}
                        className={`${cls} select-none`}
                        style={{
                          width: "clamp(210px, 23vw, 320px)",
                          height: "clamp(265px, 29vw, 410px)",
                          pointerEvents: isMain ? "auto" : "none",
                        }}
                        aria-hidden={!isMain}
                      >
                        <img
                          src={slide.productCutout || slide.imageDesktop}
                          alt={slide.imageAlt || "Cup es krim Pea"}
                          className="w-full h-full object-contain pointer-events-none select-none"
                          draggable={false}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* ════════ GELOMBANG / EFEK PEMISAH BAWAH HERO PILIHAN ADMIN ════════ */}
          <HeroBottomDivider effect={settings.bottomEffect} color={currentTheme.waveColor} />
        </section>
      </div>

      {/* ── Modal Dialog / Bottom Sheet for "Pesan via Aplikasi" ── */}
      <AppsModal
        isOpen={isAppsModalOpen}
        onClose={() => setIsAppsModalOpen(false)}
        apps={activeApps}
      />
    </>
  );
}
