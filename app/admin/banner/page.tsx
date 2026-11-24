"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BannerSlide,
  INITIAL_BANNERS,
  getStoredBanners,
  saveStoredBanners,
  CarouselAnimationSettings,
  DEFAULT_CAROUSEL_SETTINGS,
  getStoredCarouselSettings,
  DIVIDER_EFFECTS,
  COLOR_PRESETS,
  getHeroGradient,
} from "@/lib/banners-data";
import {
  adminFetchAllBanners,
  adminSaveBanner,
  adminDeleteBanner,
  adminUpdateBannerOrder,
  fetchCarouselSettings,
  adminSaveCarouselSettings,
} from "@/lib/supabase/services/banners";
import { Product, DUMMY_PRODUCTS } from "@/lib/dummy-data";
import { adminFetchAllProducts } from "@/lib/supabase/services/products";
import {
  Plus,
  Edit3,
  Trash2,
  Check,
  Eye,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  ExternalLink,
  Save,
  RotateCcw,
  Layers,
  Sliders,
  Package,
  Palette,
  Paintbrush,
  CheckCircle2,
} from "lucide-react";
import { DividerMiniPreview, HeroBottomDivider } from "@/components/home/hero-dividers";

export default function AdminBannerPage() {
  const [banners, setBanners] = useState<BannerSlide[]>(INITIAL_BANNERS);
  const [editingBanner, setEditingBanner] = useState<BannerSlide | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Available catalog products for direct one-click banner addition
  const [products, setProducts] = useState<Product[]>([]);

  // Color selection mode: preset template vs custom hex
  const [colorMode, setColorMode] = useState<"preset" | "custom">("preset");
  const [customHex, setCustomHex] = useState("#FF6B9D");

  // Carousel animation settings
  const [carouselSettings, setCarouselSettings] = useState<CarouselAnimationSettings>(DEFAULT_CAROUSEL_SETTINGS);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Load banners, products, and animation settings on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [bannerData, animData, prodData] = await Promise.all([
          adminFetchAllBanners(),
          fetchCarouselSettings(),
          adminFetchAllProducts().catch(() => []),
        ]);
        setBanners(bannerData);
        if (animData) setCarouselSettings(animData);
        if (prodData) setProducts(prodData);
      } catch (err: any) {
        console.warn("Supabase load fallback:", err.message);
        setBanners(getStoredBanners());
        setCarouselSettings(getStoredCarouselSettings());
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveCarouselSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);

    const validated: CarouselAnimationSettings = {
      autoplay: carouselSettings.autoplay,
      intervalSeconds: Math.min(20, Math.max(3, Number(carouselSettings.intervalSeconds) || 6)),
      transitionMs: Math.min(1500, Math.max(300, Number(carouselSettings.transitionMs) || 1200)),
      bottomEffect: carouselSettings.bottomEffect || "melting-wave",
    };

    setCarouselSettings(validated);

    try {
      await adminSaveCarouselSettings(validated);
      // Also post to server API for backend verification
      await fetch("/api/admin/banner-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      showNotification("Pengaturan animasi hero berhasil disimpan ke database!");
    } catch (err: any) {
      showNotification(`Gagal menyimpan pengaturan: ${err.message}`, true);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(""), 4000);
    } else {
      setSavedNotice(msg);
      setTimeout(() => setSavedNotice(""), 3500);
    }
  };

  const handleToggleActive = async (id: string) => {
    const updated = banners.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b));
    const target = updated.find((b) => b.id === id);
    setBanners(updated);
    saveStoredBanners(updated);

    if (target) {
      try {
        await adminSaveBanner(target);
        showNotification("Status keaktifan banner berhasil disimpan di database.");
      } catch (e: any) {
        showNotification(`Disimpan lokal. Supabase error: ${e.message}`, true);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus banner ini dari daftar?")) {
      const updated = banners.filter((b) => b.id !== id);
      setBanners(updated);
      saveStoredBanners(updated);

      try {
        await adminDeleteBanner(id);
        showNotification("Banner berhasil dihapus dari database.");
      } catch (e: any) {
        showNotification(`Dihapus lokal. Supabase error: ${e.message}`, true);
      }
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const list = [...banners];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const reordered = list.map((b, i) => ({ ...b, order: i + 1 }));
    setBanners(reordered);
    saveStoredBanners(reordered);

    try {
      await adminUpdateBannerOrder(reordered);
      showNotification("Urutan tayang banner berhasil diperbarui di database.");
    } catch (e: any) {
      showNotification(`Urutan disimpan lokal. Supabase: ${e.message}`, true);
    }
  };

  const handleSelectProductForBanner = (product: Product) => {
    if (!editingBanner) return;

    const nameLower = product.name.toLowerCase();
    let cutout = "/cutouts/pea-cup-strawberry.svg";
    let matchedTheme = "pink";

    if (nameLower.includes("vanilla") || nameLower.includes("durian") || nameLower.includes("keju")) {
      cutout = "/cutouts/pea-cup-vanilla.svg";
      matchedTheme = "yellow";
    } else if (nameLower.includes("choc") || nameLower.includes("cokelat") || nameLower.includes("oreo")) {
      cutout = "/cutouts/pea-cup-chocolate.svg";
      matchedTheme = "blue";
    } else if (nameLower.includes("matcha") || nameLower.includes("green tea")) {
      cutout = "/cutouts/pea-cup-matcha.svg";
      matchedTheme = "green";
    } else if (nameLower.includes("pandan")) {
      cutout = "/cutouts/pea-cup-matcha.svg";
      matchedTheme = "pandan";
    } else if (nameLower.includes("taro") || nameLower.includes("ube")) {
      cutout = "/cutouts/pea-cup-strawberry.svg";
      matchedTheme = "purple";
    } else if (nameLower.includes("kopi") || nameLower.includes("mocca") || nameLower.includes("caramel")) {
      cutout = "/cutouts/pea-cup-chocolate.svg";
      matchedTheme = "caramel";
    } else {
      cutout = product.images?.[0] || "/cutouts/pea-cup-strawberry.svg";
    }

    const imgUrl = (product.images && product.images[0] && !product.images[0].includes("placeholder"))
      ? product.images[0]
      : cutout;

    setEditingBanner({
      ...editingBanner,
      flavorLabel: product.name,
      title: "Kelembutan yang menyatu dengan manis yang pas.",
      subtitle: product.description || "Sajian es krim dengan cita rasa seimbang yang selalu tepat dinikmati kapan saja.",
      imageDesktop: imgUrl,
      imageMobile: imgUrl,
      productCutout: imgUrl,
      imageAlt: `Cup es krim ${product.name} Pea Ice Cream`,
      badge: "Pea Ice Cream",
      ctaText: "Pesan Sekarang",
      ctaLink: `/katalog/${product.id}`,
      bgTheme: matchedTheme,
    });
    setColorMode("preset");
  };

  const handleOpenAddFromProduct = () => {
    if (products.length === 0) {
      alert("Belum ada produk di katalog. Silakan buat produk terlebih dahulu melalui menu Produk & Menu.");
      return;
    }
    const firstProduct = products[0];
    const nameLower = firstProduct.name.toLowerCase();
    let cutout = "/cutouts/pea-cup-vanilla.svg";
    let matchedTheme = "yellow";
    if (nameLower.includes("choc")) { cutout = "/cutouts/pea-cup-chocolate.svg"; matchedTheme = "blue"; }
    else if (nameLower.includes("straw")) { cutout = "/cutouts/pea-cup-strawberry.svg"; matchedTheme = "pink"; }
    else if (nameLower.includes("matcha")) { cutout = "/cutouts/pea-cup-matcha.svg"; matchedTheme = "green"; }

    setEditingBanner({
      id: crypto.randomUUID ? crypto.randomUUID() : `banner-${Date.now()}`,
      order: banners.length + 1,
      isActive: true,
      title: "Kelembutan yang menyatu dengan manis yang pas.",
      subtitle: firstProduct.description || "Sajian es krim dengan cita rasa seimbang yang selalu tepat dinikmati kapan saja.",
      ctaText: "Pesan Sekarang",
      ctaLink: `/katalog/${firstProduct.id}`,
      badge: "Pea Ice Cream",
      flavorLabel: firstProduct.name,
      bgTheme: matchedTheme,
      imageDesktop: cutout,
      imageMobile: cutout,
      productCutout: cutout,
      imageAlt: `Cup es krim ${firstProduct.name} Pea Ice Cream`,
    });
    setColorMode("preset");
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingBanner({
      id: crypto.randomUUID ? crypto.randomUUID() : `banner-${Date.now()}`,
      order: banners.length + 1,
      isActive: true,
      title: "Kelembutan yang menyatu dengan manis yang pas.",
      subtitle: "Sajian es krim dengan cita rasa seimbang yang selalu tepat dinikmati kapan saja.",
      ctaText: "Pesan Sekarang",
      ctaLink: "/katalog",
      badge: "Pea Ice Cream",
      bgTheme: "pink",
      flavorLabel: "Strawberry Bliss",
      imageDesktop: "/cutouts/pea-cup-strawberry.svg",
      imageMobile: "/cutouts/pea-cup-strawberry.svg",
      productCutout: "/cutouts/pea-cup-strawberry.svg",
      imageAlt: "Cup es krim Strawberry Bliss Pea Ice Cream",
    });
    setColorMode("preset");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: BannerSlide) => {
    setEditingBanner({ ...banner });
    if (banner.bgTheme && banner.bgTheme.startsWith("#")) {
      setColorMode("custom");
      setCustomHex(banner.bgTheme);
    } else {
      setColorMode("preset");
    }
    setIsModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    setIsSaving(true);
    const exists = banners.some((b) => b.id === editingBanner.id);
    let updated: BannerSlide[];
    if (exists) {
      updated = banners.map((b) => (b.id === editingBanner.id ? editingBanner : b));
    } else {
      updated = [...banners, editingBanner];
    }
    updated.sort((a, b) => a.order - b.order);

    setBanners(updated);
    saveStoredBanners(updated);

    try {
      await adminSaveBanner(editingBanner);
      showNotification("Banner berhasil disimpan permanen di database Supabase!");
    } catch (err: any) {
      showNotification(`Tersimpan lokal. Catatan Supabase: ${err.message}`, true);
    } finally {
      setIsSaving(false);
      setIsModalOpen(false);
      setEditingBanner(null);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingBanner) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "banners");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah gambar");

      setEditingBanner({
        ...editingBanner,
        imageDesktop: data.url,
        imageMobile: data.url,
        productCutout: data.url,
      });
      showNotification("Gambar banner berhasil diunggah ke Supabase Storage!");
    } catch (err: any) {
      showNotification(`Gagal upload storage: ${err.message}`, true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetToDefault = async () => {
    if (confirm("Kembalikan 3 banner ke setelan default awal?")) {
      setBanners(INITIAL_BANNERS);
      saveStoredBanners(INITIAL_BANNERS);
      try {
        for (const b of INITIAL_BANNERS) {
          await adminSaveBanner(b);
        }
        showNotification("Banner direset ke 3 setelan default di Supabase.");
      } catch (err: any) {
        showNotification(`Reset lokal berhasil. Supabase: ${err.message}`, true);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue">
            Kustomisasi Banner Beranda
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-nunito">
            Atur hero banner besar di beranda: tambah slide baru, ubah judul, teks tombol, warna tema, gambar, dan urutan tayang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold font-nunito flex items-center gap-1.5 transition-colors"
            title="Reset ke 4 banner default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Default</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddFromProduct}
            className="px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-nunito shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>Tambah dari Produk</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-colors shadow-pink-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Banner Baru</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold font-nunito flex items-center gap-2 animate-fade-in shadow-sm">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* ─── Pengaturan Global Animasi Hero Carousel ──────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-brand-pink" />
            <div>
              <h2 className="font-fredoka text-base text-brand-dark-blue">
                Pengaturan Global Animasi Hero
              </h2>
              <p className="text-[11px] text-slate-400 font-nunito">
                Atur pergantian otomatis, jeda tayang, dan kecepatan gerakan transisi panggung hero.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-pink-50 text-brand-pink font-nunito">
            {carouselSettings.autoplay ? "Autoplay Aktif" : "Autoplay Nonaktif"}
          </span>
        </div>

        <form onSubmit={handleSaveCarouselSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Toggle Autoplay */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                  Pergantian Otomatis
                </label>
                <p className="text-[11px] text-slate-500 font-nunito mb-3">
                  Slide hero berputar otomatis tanpa tombol kontrol.
                </p>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={carouselSettings.autoplay}
                  onChange={(e) => setCarouselSettings({ ...carouselSettings, autoplay: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-pink focus:ring-brand-pink"
                />
                <span className="text-xs font-bold text-slate-700 font-nunito">
                  {carouselSettings.autoplay ? "Aktifkan Rotasi Otomatis" : "Tampilkan Statis (Mati)"}
                </span>
              </label>
            </div>

            {/* Lama Tampil Tiap Slide */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                  Lama Tampil Tiap Slide (Detik)
                </label>
                <p className="text-[11px] text-slate-500 font-nunito mb-2">
                  Waktu slide diam sebelum mulai berpindah (Batas: 3–20 dtk, default: 6 dtk).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="3"
                  max="20"
                  step="1"
                  required
                  value={carouselSettings.intervalSeconds}
                  onChange={(e) =>
                    setCarouselSettings({
                      ...carouselSettings,
                      intervalSeconds: parseInt(e.target.value, 10) || 6,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-nunito font-bold text-slate-800 focus:outline-none focus:border-brand-pink bg-white"
                />
                <span className="text-xs text-slate-500 font-nunito font-semibold">detik</span>
              </div>
            </div>

            {/* Durasi Animasi Perpindahan */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                  Durasi Animasi Gerakan (ms)
                </label>
                <p className="text-[11px] text-slate-500 font-nunito mb-2">
                  Waktu gerakan transisi produk saat berganti (Batas: 300–1500 ms, default: 800 ms).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="300"
                  max="1500"
                  step="50"
                  required
                  value={carouselSettings.transitionMs}
                  onChange={(e) =>
                    setCarouselSettings({
                      ...carouselSettings,
                      transitionMs: parseInt(e.target.value, 10) || 800,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-nunito font-bold text-slate-800 focus:outline-none focus:border-brand-pink bg-white"
                />
                <span className="text-xs text-slate-500 font-nunito font-semibold">ms</span>
              </div>
            </div>

          </div>

          {/* ─── Pilihan Efek Pemisah Bawah Hero ─── */}
          <div className="pt-4 border-t border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 font-nunito flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-brand-pink" />
                  <span>Pilihan Efek Pembatas Bawah Hero (Bottom Divider)</span>
                </label>
                <p className="text-[11px] text-slate-500 font-nunito">
                  Pilih gaya transisi grafis pemisah di bagian bawah banner hero untuk mempercantik tampilan beranda website.
                </p>
              </div>
              
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-pink-100 text-brand-pink font-nunito border border-pink-200 self-start sm:self-auto">
                Aktif: {DIVIDER_EFFECTS.find((e) => e.id === (carouselSettings.bottomEffect || "melting-wave"))?.name || "Gelombang Meleleh"}
              </span>
            </div>

            {/* Live Miniature Preview Box */}
            <div className="relative rounded-2xl overflow-hidden border border-pink-200/70 bg-gradient-to-r from-[#FF6B9D] via-[#FF85B1] to-[#FFA1C5] p-4 text-white shadow-inner">
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/30 backdrop-blur-xs font-nunito">
                    Live Preview Efek Bawah
                  </span>
                  <span className="text-xs font-fredoka font-semibold">
                    Pea Ice Cream Hero Divider
                  </span>
                </div>
                <span className="text-[10px] text-white/90 font-nunito hidden sm:inline">
                  Pilihan Saat Ini: <strong>{carouselSettings.bottomEffect || "melting-wave"}</strong>
                </span>
              </div>

              {/* The SVG divider itself rendered live */}
              <HeroBottomDivider effect={carouselSettings.bottomEffect || "melting-wave"} color="#FFF6D6" />
            </div>

            {/* Grid of 8 Selectable Divider Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DIVIDER_EFFECTS.map((eff) => {
                const isSelected = (carouselSettings.bottomEffect || "melting-wave") === eff.id;
                return (
                  <button
                    key={eff.id}
                    type="button"
                    onClick={() => setCarouselSettings({ ...carouselSettings, bottomEffect: eff.id })}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between group relative ${
                      isSelected
                        ? "bg-pink-50/80 border-brand-pink ring-2 ring-brand-pink/30 shadow-xs"
                        : "bg-white hover:bg-slate-50 border-slate-200"
                    }`}
                  >
                    {eff.badge && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        {eff.badge}
                      </span>
                    )}

                    <div className="w-full">
                      <div className="mb-2">
                        <DividerMiniPreview effect={eff.id} />
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] font-bold shrink-0 ${
                            isSelected
                              ? "bg-brand-pink border-brand-pink text-white"
                              : "border-slate-300 group-hover:border-slate-400 text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                        <span className="font-fredoka text-xs font-bold text-slate-800 line-clamp-1">
                          {eff.name.split(" (")[0]}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-500 font-nunito line-clamp-2 leading-relaxed">
                        {eff.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-5 py-2.5 rounded-full bg-brand-pink hover:bg-brand-pink-dark text-white text-xs font-bold font-nunito shadow-pink-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? "Menyimpan..." : "Simpan Pengaturan Animasi"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ─── Demo Notice ──────────────────────────────────────────── */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-xs font-nunito flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Fitur Kustomisasi Banner:</strong>
          <p className="mt-0.5 text-amber-800">
            Setiap perubahan banner langsung diterapkan seketika ke halaman Beranda tanpa perlu reload server. Data disimpan di memori browser (localStorage) dan siap disambungkan ke tabel PostgreSQL <code>banners</code> di Supabase pada tahap backend.
          </p>
        </div>
      </div>

      {/* ─── Banner List Table ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-pink" />
            <h2 className="font-fredoka text-base text-brand-dark-blue">
              Daftar Slide Banner Aktif ({banners.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-nunito font-semibold">
            {banners.filter((b) => b.isActive).length} slide sedang tayang
          </span>
        </div>

        {banners.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs font-nunito">
            Belum ada banner. Klik &quot;Tambah Banner Baru&quot; untuk membuat slide hero baru.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-nunito">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-center">Urutan</th>
                  <th className="px-4 py-3">Visual Gambar</th>
                  <th className="px-4 py-3">Tema</th>
                  <th className="px-4 py-3">Judul & Teks Pendukung</th>
                  <th className="px-4 py-3">Tombol & Tautan</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {banners.map((banner, idx) => (
                  <tr key={banner.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Order buttons */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveOrder(idx, "up")}
                          className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-600"
                          title="Pindah ke atas"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono font-bold text-xs w-4 text-center">
                          {banner.order}
                        </span>
                        <button
                          type="button"
                          disabled={idx === banners.length - 1}
                          onClick={() => handleMoveOrder(idx, "down")}
                          className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-600"
                          title="Pindah ke bawah"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Image Thumbnail */}
                    <td className="px-4 py-3">
                      <div
                        className="w-20 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0 relative"
                        style={{
                          width: "80px",
                          height: "56px",
                          minWidth: "80px",
                          minHeight: "56px",
                          maxWidth: "80px",
                          maxHeight: "56px",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={banner.imageDesktop}
                          alt={banner.imageAlt || banner.title}
                          className="w-full h-full object-cover"
                          style={{
                            width: "80px",
                            height: "56px",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </div>
                    </td>

                    {/* Theme Badge */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs flex-shrink-0"
                          style={{
                            backgroundColor:
                              COLOR_PRESETS.find((p) => p.id === banner.bgTheme)?.hex ||
                              (banner.bgTheme?.startsWith("#") ? banner.bgTheme : "#FF6B9D"),
                          }}
                        />
                        <span className="font-bold text-[11px] text-slate-700 capitalize">
                          {COLOR_PRESETS.find((p) => p.id === banner.bgTheme)?.name.split(" ")[0] ||
                            (banner.bgTheme?.startsWith("#") ? banner.bgTheme : "Pink")}
                        </span>
                      </div>
                    </td>

                    {/* Title & Subtitle */}
                    <td className="px-4 py-3 max-w-xs">
                      {banner.badge && (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-brand-dark-blue text-[10px] font-bold mb-1">
                          {banner.badge}
                        </span>
                      )}
                      <strong className="block font-fredoka text-sm text-brand-dark-blue line-clamp-1">
                        {banner.title}
                      </strong>
                      <p className="text-slate-500 text-[11px] line-clamp-1">
                        {banner.subtitle}
                      </p>
                    </td>

                    {/* Button & Link */}
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800 block text-[11px]">
                        &quot;{banner.ctaText}&quot;
                      </span>
                      <span className="text-[10px] text-brand-pink font-mono">
                        {banner.ctaLink}
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(banner.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${
                          banner.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {banner.isActive ? "Aktif Tayang" : "Nonaktif"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(banner)}
                          className="p-1.5 text-slate-500 hover:text-brand-pink hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Banner"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(banner.id)}
                          className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Banner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Live Carousel Preview Card ───────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-fredoka text-base text-brand-dark-blue flex items-center gap-2">
            <Eye className="w-4 h-4 text-brand-pink" />
            <span>Pratinjau Hero Banner Besar (Tampilan di Beranda)</span>
          </h2>
          <Link
            href="/"
            target="_blank"
            className="text-xs font-bold text-brand-pink hover:underline flex items-center gap-1 font-nunito"
          >
            <span>Buka Halaman Beranda Langsung</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {banners.filter((b) => b.isActive).map((b, i) => (
            <div
              key={b.id}
              className="border border-pink-100 rounded-2xl p-4 bg-gradient-to-br from-pink-50/70 via-white to-pink-50/40 flex flex-col justify-between shadow-sm"
            >
              <div
                className="relative aspect-[16/10] w-full rounded-xl overflow-hidden mb-3 border border-white/30 flex items-center justify-center p-2"
                style={{
                  background: getHeroGradient(b.bgTheme),
                  position: "relative",
                  width: "100%",
                  height: "140px",
                  maxHeight: "140px",
                  overflow: "hidden",
                }}
              >
                <img
                  src={b.imageDesktop}
                  alt={b.imageAlt || b.title}
                  className="w-full h-full object-contain drop-shadow-md"
                  style={{
                    width: "100%",
                    height: "140px",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
                <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/40 text-white text-[10px] font-bold backdrop-blur-xs">
                  Slide #{i + 1}
                </span>
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/30 text-white text-[9px] font-mono font-bold backdrop-blur-xs">
                  {b.bgTheme || "pink"}
                </span>
              </div>
              <div>
                <span className="inline-block px-2 py-0.5 rounded-full bg-white text-[9px] font-bold text-brand-pink border border-pink-200 mb-1">
                  {b.badge || "pea ice cream"}
                </span>
                <h3 className="font-fredoka text-sm text-brand-dark-blue line-clamp-1 mb-1">
                  {b.title}
                </h3>
                <p className="text-[11px] text-gray-500 font-nunito line-clamp-2 mb-3 leading-relaxed">
                  {b.subtitle}
                </p>
                <div className="text-[11px] font-bold text-white bg-gradient-to-r from-brand-pink to-brand-pink-light px-3 py-1.5 rounded-full text-center shadow-sm">
                  {b.ctaText} →
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Modal Edit / Tambah Banner ───────────────────────────── */}
      {isModalOpen && editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-pink-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-5 h-5 text-brand-pink" />
              <h3 className="font-fredoka text-xl text-brand-dark-blue">
                {banners.some((b) => b.id === editingBanner.id) ? "Kustomisasi Banner" : "Tambah Banner Baru"}
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-nunito mb-5">
              Atur konten teks, gambar visual, tema warna, dan tombol ajakan aksi banner besar.
            </p>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* ─── Pilih Cepat Produk Menu untuk Banner ─── */}
              <div className="bg-pink-50/70 border border-pink-200/80 rounded-2xl p-3.5 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-brand-dark-blue font-nunito flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-brand-pink" />
                    <span>Pilih Cepat Produk Menu ({products.length} Varian Tersedia)</span>
                  </label>
                  <span className="text-[10px] text-brand-pink font-semibold">Klik produk untuk mengisi data otomatis</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                  {products.map((p) => {
                    const isSelected = editingBanner.flavorLabel === p.name;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProductForBanner(p)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all group ${
                          isSelected
                            ? "bg-white border-brand-pink ring-2 ring-brand-pink/30 shadow-xs"
                            : "bg-white/90 hover:bg-white border-slate-200 hover:border-pink-300"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-pink-100/70 border border-pink-200/60 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          <Package className="w-3.5 h-3.5 text-brand-pink" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block font-fredoka text-xs text-brand-dark-blue truncate leading-tight group-hover:text-brand-pink">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {p.category}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                  Judul Utama Banner Besar <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kelembutan yang menyatu dengan manis yang pas."
                  value={editingBanner.title}
                  onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                  Teks Pendukung / Deskripsi Singkat <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Sajian es krim dengan cita rasa seimbang yang selalu tepat dinikmati kapan saja."
                  value={editingBanner.subtitle}
                  onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                    Label Rasa (Hero Pill)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Strawberry Bliss"
                    value={editingBanner.flavorLabel || ""}
                    onChange={(e) => setEditingBanner({ ...editingBanner, flavorLabel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                    Label Badge / Tag
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pea Ice Cream"
                    value={editingBanner.badge || ""}
                    onChange={(e) => setEditingBanner({ ...editingBanner, badge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                    Urutan Slide (Order)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingBanner.order}
                    onChange={(e) => setEditingBanner({ ...editingBanner, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
                  />
                </div>
              </div>

              {/* ─── Background Color Customization Panel (Template vs Custom) ─── */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 font-nunito flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-brand-pink" />
                      <span>Warna Background Hero Banner</span>
                    </label>
                    <p className="text-[11px] text-slate-500 font-nunito">
                      Pilih dari template warna yang sudah disediakan atau tentukan warna kustom bebas.
                    </p>
                  </div>

                  {/* Mode Switcher Pills */}
                  <div className="inline-flex rounded-xl p-1 bg-white border border-slate-200 shadow-2xs self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setColorMode("preset");
                        if (editingBanner.bgTheme && editingBanner.bgTheme.startsWith("#")) {
                          setEditingBanner({ ...editingBanner, bgTheme: "pink" });
                        }
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-nunito transition-all flex items-center gap-1 ${
                        colorMode === "preset"
                          ? "bg-brand-pink text-white shadow-xs"
                          : "text-slate-600 hover:text-brand-pink"
                      }`}
                    >
                      <span>Template Warna</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setColorMode("custom");
                        const initHex = editingBanner.bgTheme?.startsWith("#") ? editingBanner.bgTheme : customHex || "#FF6B9D";
                        setCustomHex(initHex);
                        setEditingBanner({ ...editingBanner, bgTheme: initHex });
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-nunito transition-all flex items-center gap-1 ${
                        colorMode === "custom"
                          ? "bg-brand-pink text-white shadow-xs"
                          : "text-slate-600 hover:text-brand-pink"
                      }`}
                    >
                      <Paintbrush className="w-3 h-3" />
                      <span>Custom Warna</span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: Template Warna (Preset) */}
                {colorMode === "preset" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {COLOR_PRESETS.map((preset) => {
                      const isSelected = editingBanner.bgTheme === preset.id || (!editingBanner.bgTheme && preset.id === "pink");
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setEditingBanner({ ...editingBanner, bgTheme: preset.id })}
                          className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                            isSelected
                              ? "bg-white border-brand-pink ring-2 ring-brand-pink/30 shadow-xs"
                              : "bg-white hover:bg-slate-100/70 border-slate-200"
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full flex-shrink-0 border border-white shadow-xs flex items-center justify-center text-white text-[9px] font-bold"
                            style={{ backgroundColor: preset.hex }}
                          >
                            {isSelected ? "✓" : ""}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="block font-fredoka text-[11px] text-slate-800 truncate leading-tight">
                              {preset.name}
                            </span>
                            <span className="text-[9px] text-slate-400 block truncate font-mono">
                              {preset.hex}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* TAB 2: Custom Warna (Color Picker & Hex Input) */}
                {colorMode === "custom" && (
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                      {/* Interactive Color Picker */}
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customHex}
                          onChange={(e) => {
                            const hex = e.target.value;
                            setCustomHex(hex);
                            setEditingBanner({ ...editingBanner, bgTheme: hex });
                          }}
                          className="w-10 h-10 rounded-xl cursor-pointer border-2 border-slate-200 p-0.5 bg-white"
                          title="Klik untuk memilih warna bebas"
                        />
                        <div>
                          <span className="block text-xs font-bold text-slate-700 font-nunito">
                            Color Picker
                          </span>
                          <span className="text-[10px] text-slate-400 font-nunito">
                            Klik kotak untuk palet visual
                          </span>
                        </div>
                      </div>

                      {/* Hex Text Input */}
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-slate-600 font-nunito mb-1">
                          Kode Hex Warna (#RRGGBB)
                        </label>
                        <input
                          type="text"
                          value={customHex}
                          placeholder="#FF6B9D"
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomHex(val);
                            if (val.startsWith("#") && (val.length === 7 || val.length === 4)) {
                              setEditingBanner({ ...editingBanner, bgTheme: val });
                            }
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono uppercase focus:outline-none focus:border-brand-pink"
                        />
                      </div>
                    </div>

                    {/* Quick Color Swatches */}
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Rekomendasi Warna Populer:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: "Ruby Pink", hex: "#E91E63" },
                          { name: "Deep Coral", hex: "#FF5722" },
                          { name: "Sunset Gold", hex: "#FFA000" },
                          { name: "Ocean Cyan", hex: "#00ACC1" },
                          { name: "Royal Indigo", hex: "#3F51B5" },
                          { name: "Deep Violet", hex: "#7B1FA2" },
                          { name: "Fresh Emerald", hex: "#00897B" },
                          { name: "Dark Choco", hex: "#5D4037" },
                        ].map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => {
                              setCustomHex(c.hex);
                              setEditingBanner({ ...editingBanner, bgTheme: c.hex });
                            }}
                            className="px-2 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-white flex items-center gap-1.5 text-[10px] font-nunito transition-colors"
                          >
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.hex }} />
                            <span className="text-slate-700 font-medium">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Real-time Miniature Hero Preview Box inside Modal */}
                <div className="pt-2">
                  <div
                    className="relative rounded-2xl overflow-hidden p-3.5 text-white shadow-md border border-white/20 transition-all duration-300"
                    style={{
                      background: getHeroGradient(editingBanner.bgTheme),
                      minHeight: "100px",
                    }}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="max-w-[70%]">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-white/25 backdrop-blur-xs text-[9px] font-bold text-white mb-1">
                          {editingBanner.flavorLabel || editingBanner.badge || "Pea Ice Cream"}
                        </span>
                        <h4 className="font-fredoka text-xs sm:text-sm line-clamp-1 leading-snug drop-shadow-xs">
                          {editingBanner.title || "Kelembutan yang menyatu dengan manis yang pas."}
                        </h4>
                        <p className="text-[10px] text-white/90 line-clamp-1 mt-0.5 drop-shadow-xs">
                          {editingBanner.subtitle || "Sajian es krim dengan cita rasa seimbang..."}
                        </p>
                      </div>

                      {/* Cup visual preview */}
                      <div className="w-14 h-14 relative flex-shrink-0 flex items-center justify-center">
                        <img
                          src={editingBanner.imageDesktop || "/cutouts/pea-cup-strawberry.svg"}
                          alt="Preview cup"
                          className="w-full h-full object-contain drop-shadow-md"
                        />
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between text-[10px] text-white/90">
                      <span>Pratinjau Langsung Warna Hero</span>
                      <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full text-[9px]">
                        {editingBanner.bgTheme || "pink"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                    Teks Tombol CTA <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lihat Semua Menu"
                    value={editingBanner.ctaText}
                    onChange={(e) => setEditingBanner({ ...editingBanner, ctaText: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                    Tautan Tujuan Tombol <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: /katalog atau /katalog?kategori=signature"
                    value={editingBanner.ctaLink}
                    onChange={(e) => setEditingBanner({ ...editingBanner, ctaLink: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                  Pilihan Gambar Visual Produk
                </label>
                <select
                  value={editingBanner.imageDesktop}
                  onChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      imageDesktop: e.target.value,
                      imageMobile: e.target.value,
                      productCutout: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink bg-white mb-2"
                >
                  <option value="/cutouts/pea-cup-strawberry.svg">Cutout 1: Strawberry Bliss Cup (Pink)</option>
                  <option value="/cutouts/pea-cup-vanilla.svg">Cutout 2: Vanilla Dream Cup (Yellow)</option>
                  <option value="/cutouts/pea-cup-chocolate.svg">Cutout 3: Chocolate Fudge Cup (Blue)</option>
                  <option value="/cutouts/pea-cup-matcha.svg">Cutout 4: Matcha Kyoto Cup (Green)</option>
                  <option value="/banners/banner-classic.svg">Ilustrasi: Classic Scoop & Cone</option>
                  <option value="/banners/banner-flavors.svg">Ilustrasi: Trio Cups & Aneka Rasa</option>
                  <option value="/banners/banner-sharing.svg">Ilustrasi: Paket Berbagi Momen Manis</option>
                  <option value="/placeholder-ice-cream.jpg">Foto: Cup Produk Es Krim</option>
                </select>

                <input
                  type="text"
                  placeholder="Atau masukkan path / URL gambar kustom..."
                  value={editingBanner.imageDesktop}
                  onChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      imageDesktop: e.target.value,
                      imageMobile: e.target.value,
                      productCutout: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 focus:outline-none focus:border-brand-pink mb-2"
                />

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-brand-pink text-xs font-bold font-nunito border border-pink-200 flex items-center gap-1.5">
                    <span>{isUploading ? "Mengunggah..." : "Unggah Gambar ke Storage"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={handleUploadImage}
                    />
                  </label>
                  <span className="text-[10px] text-slate-400">JPG, PNG, WebP, SVG (Maks. 5MB)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                  Teks Alternatif Gambar (Aksesibilitas Alt Text)
                </label>
                <input
                  type="text"
                  placeholder="Deskripsi foto es krim untuk pembaca layar..."
                  value={editingBanner.imageAlt}
                  onChange={(e) => setEditingBanner({ ...editingBanner, imageAlt: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-nunito font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingBanner.isActive}
                    onChange={(e) => setEditingBanner({ ...editingBanner, isActive: e.target.checked })}
                    className="rounded text-brand-pink focus:ring-brand-pink"
                  />
                  <span>Aktifkan slide banner ini agar tayang di halaman Beranda</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingBanner(null);
                  }}
                  className="px-5 py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-colors shadow-pink-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "Menyimpan ke Database..." : "Simpan Perubahan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
