"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CupSize } from "@/lib/constants";
import {
  fetchProductById,
  adminSaveProduct,
} from "@/lib/supabase/services/products";
import {
  fetchActiveFlavors,
  fetchProductFlavorConfigs,
  MasterFlavor,
  ProductFlavorConfigItem,
} from "@/lib/supabase/services/flavors";
import {
  fetchCategories,
  ProductCategoryItem,
} from "@/lib/supabase/services/categories";
import {
  ChevronLeft,
  Save,
  Plus,
  Trash2,
  Upload,
  AlertCircle,
  Info,
  Check,
  Sparkles,
  Eye,
  AlertTriangle,
} from "lucide-react";

export default function AdminEditProdukPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  const isNew = productId === "new";

  // ─── 1. Form Basic State ──────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [category, setCategory] = useState("classic");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<ProductCategoryItem[]>([]);
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState(15000);
  const [allergensText, setAllergensText] = useState("susu, telur");
  const [imageUrl, setImageUrl] = useState("/placeholder-ice-cream.jpg");
  const [isAvailable, setIsAvailable] = useState(true);

  // ─── 2. Mix Flavor Configuration State ────────────────────────────────────
  const [isMixEnabled, setIsMixEnabled] = useState(false);
  const [minFlavorCount, setMinFlavorCount] = useState(1);
  const [maxFlavorCount, setMaxFlavorCount] = useState(2);

  // Master Flavors list from database
  const [masterFlavors, setMasterFlavors] = useState<MasterFlavor[]>([]);
  // Mapping of allowed flavors & extra price for this product: flavorId -> { enabled: boolean, extraPrice: number }
  const [productFlavorMap, setProductFlavorMap] = useState<
    Record<string, { enabled: boolean; extraPrice: number }>
  >({});

  // ─── 3. Customer Form Preview Interactive States ──────────────────────────
  const [previewSelections, setPreviewSelections] = useState<string[]>([]);

  // ─── 4. UI Feedback States ────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Load product data, categories & master flavors
  useEffect(() => {
    // 1. Fetch categories
    fetchCategories(false).then((cats) => {
      setCategories(cats);
      if (cats.length > 0 && !category) {
        setCategory(cats[0].slug);
        setCategoryId(cats[0].id);
      }
    });

    // 2. Fetch master flavors
    fetchActiveFlavors().then((flavors) => {
      setMasterFlavors(flavors);
    });

    // 3. Load product if editing
    if (!isNew && productId) {
      setIsLoading(true);
      fetchProductById(productId)
        .then(async (prod) => {
          if (prod) {
            setName(prod.name);
            setCategory(prod.category);
            if (prod.categoryId) setCategoryId(prod.categoryId);
            setDescription(prod.description);
            setBasePrice(prod.basePrice || 15000);
            setAllergensText((prod.allergens || []).join(", "));
            setImageUrl(prod.images?.[0] || "/placeholder-ice-cream.jpg");
            setIsAvailable(prod.isAvailable !== false);

            const mixActive = Boolean(prod.isMixEnabled ?? prod.hasFlavorSelection);
            setIsMixEnabled(mixActive);
            setMinFlavorCount(Math.max(1, prod.minFlavorCount || 1));
            setMaxFlavorCount(Math.max(1, prod.maxFlavorCount || prod.flavorChoiceCount || 2));

            // Load existing product flavor configs
            const configs = prod.allowedFlavors || (await fetchProductFlavorConfigs(productId));
            const map: Record<string, { enabled: boolean; extraPrice: number }> = {};
            if (configs && configs.length > 0) {
              for (const c of configs) {
                map[c.flavorId] = {
                  enabled: c.isActive !== false,
                  extraPrice: c.extraPrice || 0,
                };
              }
            }
            setProductFlavorMap(map);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [productId, isNew]);

  // Handle Category selection change
  const handleCategoryChange = (slugVal: string) => {
    setCategory(slugVal);
    const found = categories.find((c) => c.slug === slugVal);
    if (found) {
      setCategoryId(found.id);
    }
  };

  // Toggle allowed flavor for this product
  const handleToggleFlavorAllowed = (flavorId: string) => {
    setProductFlavorMap((prev) => {
      const current = prev[flavorId];
      if (current && current.enabled) {
        return {
          ...prev,
          [flavorId]: { ...current, enabled: false },
        };
      }
      return {
        ...prev,
        [flavorId]: { enabled: true, extraPrice: current?.extraPrice || 0 },
      };
    });
  };

  // Update extra price for allowed flavor
  const handleExtraPriceChange = (flavorId: string, val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    setProductFlavorMap((prev) => ({
      ...prev,
      [flavorId]: {
        enabled: prev[flavorId]?.enabled ?? true,
        extraPrice: num,
      },
    }));
  };

  // Upload image handler
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengunggah foto.");
      }
      setImageUrl(data.url);
      setSavedNotice("Foto produk berhasil diunggah!");
      setTimeout(() => setSavedNotice(""), 3000);
    } catch (err: any) {
      setErrorMessage(`Upload gagal: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // List of currently enabled flavors
  const allowedFlavorsList = masterFlavors
    .filter((f) => productFlavorMap[f.id]?.enabled)
    .map((f) => ({
      ...f,
      extraPrice: productFlavorMap[f.id]?.extraPrice || 0,
    }));

  // Validation Warnings
  const validationWarnings: string[] = [];
  if (isMixEnabled) {
    if (minFlavorCount < 1) {
      validationWarnings.push("Minimal rasa yang dipilih harus minimal 1.");
    }
    if (minFlavorCount > maxFlavorCount) {
      validationWarnings.push("Minimal rasa yang dipilih tidak boleh melebihi maksimal rasa.");
    }
    if (allowedFlavorsList.length === 0) {
      validationWarnings.push("Pilihan mix rasa aktif, namun Anda belum mencentang satu pun rasa yang diperbolehkan.");
    } else if (allowedFlavorsList.length < minFlavorCount) {
      validationWarnings.push(
        `Jumlah rasa yang dicentang (${allowedFlavorsList.length}) kurang dari minimal rasa yang dipilih (${minFlavorCount}).`
      );
    }
  }

  // Interactive Live Preview: Single Checklist Selection Simulation
  const handlePreviewToggle = (flavorId: string) => {
    setPreviewSelections((prev) => {
      if (prev.includes(flavorId)) {
        return prev.filter((id) => id !== flavorId);
      }
      if (prev.length >= maxFlavorCount) {
        return prev;
      }
      return [...prev, flavorId];
    });
  };

  // Preview Price calculation: Base price + extra price of checked flavors
  const previewExtraTotal = previewSelections.reduce((sum, fId) => {
    const extra = productFlavorMap[fId]?.extraPrice || 0;
    return sum + extra;
  }, 0);
  const previewTotalPrice = basePrice + previewExtraTotal;

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMessage("Nama produk wajib diisi.");
      return;
    }

    if (basePrice < 0) {
      setErrorMessage("Harga dasar produk tidak boleh negatif.");
      return;
    }

    if (isMixEnabled) {
      if (minFlavorCount < 1) {
        setErrorMessage("Minimal rasa yang dipilih harus minimal 1.");
        return;
      }
      if (minFlavorCount > maxFlavorCount) {
        setErrorMessage("Minimal rasa yang dipilih tidak boleh melebihi maksimal rasa.");
        return;
      }
      if (allowedFlavorsList.length < minFlavorCount) {
        setErrorMessage(
          `Silakan centang minimal ${minFlavorCount} rasa yang diperbolehkan untuk menu ini.`
        );
        return;
      }
    }

    setIsSaving(true);
    setErrorMessage("");

    const allergensList = allergensText
      .split(",")
      .map((a) => a.trim().toLowerCase())
      .filter((a) => a.length > 0);

    // Prepare configured allowed flavors payload
    const allowedFlavorsPayload: ProductFlavorConfigItem[] = Object.entries(productFlavorMap)
      .filter(([_, config]) => config.enabled)
      .map(([flavorId, config], idx) => ({
        productId: isNew ? "" : productId,
        flavorId,
        extraPrice: Math.max(0, config.extraPrice || 0),
        orderIdx: idx + 1,
        isActive: true,
      }));

    const productPayload = {
      id: isNew ? undefined : productId,
      name: name.trim(),
      category: category as any,
      categoryId: categoryId || undefined,
      description: description.trim(),
      allergens: allergensList,
      flavors: allowedFlavorsList.map((f) => f.name),
      sizes: [
        { size: "small" as CupSize, price: basePrice, allowMixFlavors: maxFlavorCount > 1 },
      ],
      images: [imageUrl],
      isAvailable,
      basePrice,
      isMixEnabled,
      minFlavorCount: Math.max(1, minFlavorCount),
      maxFlavorCount: Math.max(minFlavorCount, maxFlavorCount),
      hasFlavorSelection: isMixEnabled,
      flavorChoiceCount: maxFlavorCount,
      allowedFlavors: allowedFlavorsPayload,
    };

    try {
      await adminSaveProduct(productPayload);
      setSavedNotice("Menu es krim berhasil disimpan ke database!");
      setTimeout(() => {
        router.push("/admin/produk");
      }, 1200);
    } catch (err: any) {
      setErrorMessage(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* ─── Top Header ───────────────────────────────────────────── */}
      <div>
        <Link
          href="/admin/produk"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-pink font-nunito mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Produk</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue">
              {isNew ? "Tambah Menu Es Krim Baru" : `Edit Menu: ${name || "Tanpa Judul"}`}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-nunito">
              Atur nama, foto, deskripsi, harga, kategori admin, serta opsi mix rasa produk.
            </p>
          </div>
        </div>
      </div>

      {savedNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold font-nunito flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs font-bold font-nunito flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* ─── 1. Informasi Dasar Produk ───────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-fredoka text-base text-brand-dark-blue flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-pink" />
            <span>1. Informasi Produk & Kategori</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                Nama Produk *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Cookie Monster Cup 120 ml, Double Cone, KitKat Cup"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink"
                required
              />
              <span className="text-[10px] text-slate-400 font-nunito mt-1 block">
                Setiap produk memiliki nama spesifik sendiri sesuai kategori masing-masing.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 font-nunito">
                  Kategori Menu *
                </label>
                <Link
                  href="/admin/produk?tab=kategori"
                  className="text-[10px] font-bold text-brand-pink hover:underline font-nunito"
                >
                  + Kelola Kategori
                </Link>
              </div>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink bg-white"
                required
              >
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name} {!c.isActive ? "(Nonaktif)" : ""}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="classic">Classic</option>
                    <option value="signature">Signature</option>
                    <option value="local-flavors">Cita Rasa Lokal</option>
                    <option value="seasonal">Musiman</option>
                  </>
                )}
              </select>
              <span className="text-[10px] text-slate-400 font-nunito mt-1 block">
                Dipilih dari kategori yang Anda buat sendiri di menu Kelola Kategori.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                Harga Produk (Rp) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={basePrice}
                  onChange={(e) => setBasePrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-brand-pink"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                Alergen (Opsional)
              </label>
              <input
                type="text"
                value={allergensText}
                onChange={(e) => setAllergensText(e.target.value)}
                placeholder="susu, telur, kacang..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
              Deskripsi Produk
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi kelezatan produk es krim..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink resize-none"
            />
          </div>

          {/* Status Ketersediaan */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 font-nunito block">
                Status Ketersediaan Produk
              </span>
              <span className="text-[10px] text-slate-400 font-nunito block">
                Jika nonaktif / habis, produk ini tidak akan dapat dibeli di katalog.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}
            >
              {isAvailable ? "Aktif / Tersedia" : "Nonaktif / Habis"}
            </button>
          </div>
        </div>

        {/* ─── 2. Pengaturan Mix Rasa ──────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-fredoka text-base text-brand-dark-blue flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-pink" />
                <span>2. Pengaturan Mix Rasa</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-nunito mt-0.5">
                Aktifkan jika produk ini mengizinkan pelanggan mencentang kombinasi beberapa rasa.
              </p>
            </div>

            {/* Toggle: Aktifkan pilihan mix rasa */}
            <div className="flex items-center gap-2.5 bg-pink-50/80 border border-pink-200 px-3.5 py-1.5 rounded-full self-start sm:self-auto">
              <span className="text-xs font-bold text-brand-dark-blue font-nunito">
                Aktifkan pilihan mix rasa
              </span>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !isMixEnabled;
                  setIsMixEnabled(nextVal);
                  if (nextVal) {
                    setPreviewSelections([]);
                  }
                }}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                  isMixEnabled ? "bg-brand-pink" : "bg-slate-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    isMixEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {!isMixEnabled ? (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-1">
              <span className="font-fredoka text-sm text-slate-700 block">
                Pilihan Mix Rasa Nonaktif
              </span>
              <p className="text-xs text-slate-500 font-nunito max-w-md mx-auto">
                Pelanggan langsung menentukan jumlah produk dan menambah ke keranjang tanpa perlu memilih ulang rasa yang sudah menjadi identitas produk ini.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Parameter Mix: Min dan Max */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-pink-50/40 p-4 rounded-2xl border border-pink-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                    Minimal rasa yang dipilih
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={maxFlavorCount}
                    value={minFlavorCount}
                    onChange={(e) =>
                      setMinFlavorCount(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-brand-pink bg-white"
                  />
                  <span className="text-[10px] text-slate-400 font-nunito mt-0.5 block">
                    Default 1 rasa (tidak boleh melebihi maksimal).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                    Maksimal rasa yang dipilih
                  </label>
                  <input
                    type="number"
                    min={minFlavorCount}
                    max={10}
                    value={maxFlavorCount}
                    onChange={(e) =>
                      setMaxFlavorCount(
                        Math.max(minFlavorCount, parseInt(e.target.value) || minFlavorCount)
                      )
                    }
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-brand-pink bg-white"
                  />
                  <span className="text-[10px] text-slate-400 font-nunito mt-0.5 block">
                    Batas jumlah rasa yang dapat dicentang pelanggan (misal: 2 atau 3).
                  </span>
                </div>
              </div>

              {/* Validation Warnings Alert */}
              {validationWarnings.length > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-amber-800 text-xs font-bold font-nunito">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Perhatian Pengaturan Mix Rasa:</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-amber-900 font-nunito space-y-0.5 pl-1">
                    {validationWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Daftar Rasa yang Bisa Dipilih untuk Produk Ini */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-fredoka text-sm text-brand-dark-blue flex items-center gap-1.5">
                      <span>Daftar Rasa yang Bisa Dipilih</span>
                    </h3>
                    <span className="text-[10px] text-slate-400 font-nunito">
                      Centang rasa apa saja dari Master Rasa yang tersedia untuk di-mix pada produk ini.
                    </span>
                  </div>

                  <Link
                    href="/admin/rasa"
                    target="_blank"
                    className="text-[11px] font-bold text-brand-pink hover:underline font-nunito flex items-center gap-1"
                  >
                    <span>+ Kelola Master Rasa</span>
                    <span className="text-xs">↗</span>
                  </Link>
                </div>

                {masterFlavors.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-xs text-slate-500 font-nunito mb-2">
                      Belum ada rasa di Master Rasa. Silakan buat rasa terlebih dahulu.
                    </p>
                    <Link
                      href="/admin/rasa"
                      className="px-3 py-1.5 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buka Master Rasa</span>
                    </Link>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    {masterFlavors.map((flavor) => {
                      const isChecked = Boolean(productFlavorMap[flavor.id]?.enabled);
                      const currentExtra = productFlavorMap[flavor.id]?.extraPrice || 0;

                      return (
                        <div
                          key={flavor.id}
                          className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                            isChecked ? "bg-white" : "bg-slate-50/50 opacity-75"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`flavor-${flavor.id}`}
                              checked={isChecked}
                              onChange={() => handleToggleFlavorAllowed(flavor.id)}
                              className="w-4 h-4 accent-brand-pink rounded cursor-pointer"
                            />
                            <label
                              htmlFor={`flavor-${flavor.id}`}
                              className="cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-fredoka text-sm text-brand-dark-blue">
                                  {flavor.name}
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                    flavor.isAvailable
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {flavor.isAvailable ? "Tersedia" : "Habis"}
                                </span>
                              </div>
                              {flavor.description && (
                                <span className="text-[11px] text-slate-400 font-nunito block">
                                  {flavor.description}
                                </span>
                              )}
                            </label>
                          </div>

                          {isChecked && (
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <span className="text-[11px] text-slate-500 font-nunito">
                                Tambahan Biaya Khusus (Opsional):
                              </span>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-bold">
                                  +Rp
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  step={500}
                                  value={currentExtra}
                                  onChange={(e) =>
                                    handleExtraPriceChange(flavor.id, e.target.value)
                                  }
                                  className="w-28 pl-9 pr-2.5 py-1 rounded-lg border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-brand-pink bg-white"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── 3. Pratinjau Formulir Pelanggan (Single Checkbox List) ─── */}
        <div className="bg-gradient-to-b from-white to-pink-50/40 rounded-2xl p-5 border border-pink-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-pink-100 pb-3">
            <div>
              <h2 className="font-fredoka text-base text-brand-dark-blue flex items-center gap-2">
                <Eye className="w-4 h-4 text-brand-pink" />
                <span>Pratinjau Pelanggan (Live Preview)</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-nunito mt-0.5">
                Simulasi nyata formulir pemesanan yang akan dilihat oleh pelanggan di halaman produk.
              </p>
            </div>
            <span className="text-[10px] font-bold text-brand-pink bg-pink-100 px-2.5 py-1 rounded-full">
              Satu Daftar Checkbox
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs max-w-lg mx-auto space-y-4">
            <div>
              <span className="font-fredoka text-lg text-brand-dark-blue block leading-tight">
                {name || "Nama Produk"}
              </span>
              <span className="text-xs text-slate-500 font-nunito block mt-0.5">
                {description || "Deskripsi produk es krim..."}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-400 font-nunito">Harga:</span>
                <span className="font-fredoka text-base text-brand-pink font-semibold">
                  Rp {previewTotalPrice.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Checkbox List Mix Preview */}
            {isMixEnabled ? (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-fredoka text-sm text-brand-dark-blue">
                    Pilih rasa
                  </h3>
                  <span className="text-[11px] font-bold text-brand-pink font-nunito bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-100">
                    Pilih {minFlavorCount === maxFlavorCount ? `${maxFlavorCount}` : `${minFlavorCount}–${maxFlavorCount}`} rasa · {previewSelections.length}/{maxFlavorCount} dipilih
                  </span>
                </div>

                <div className="space-y-2">
                  {allowedFlavorsList.map((flavor) => {
                    const isSelected = previewSelections.includes(flavor.id);
                    const isOutOfStock = !flavor.isAvailable;
                    const isMaxReached = previewSelections.length >= maxFlavorCount;
                    const isDisabled = isOutOfStock || (!isSelected && isMaxReached);

                    return (
                      <label
                        key={flavor.id}
                        onClick={() => {
                          if (!isDisabled || isSelected) {
                            handlePreviewToggle(flavor.id);
                          }
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer select-none text-xs font-nunito ${
                          isSelected
                            ? "border-brand-pink bg-pink-50/70 text-brand-dark-blue"
                            : isOutOfStock
                            ? "border-slate-100 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed"
                            : isMaxReached
                            ? "border-slate-100 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed"
                            : "border-slate-200 hover:border-pink-200 hover:bg-pink-50/20 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled && !isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 accent-brand-pink rounded"
                          />
                          <span className={`font-semibold ${isSelected ? "text-brand-pink" : ""}`}>
                            {flavor.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {flavor.extraPrice > 0 && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              +Rp {flavor.extraPrice.toLocaleString("id-ID")}
                            </span>
                          )}
                          {isOutOfStock && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                              Habis
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 font-nunito">
                Rasa bawaan produk (tanpa pilihan mix tambahan).
              </div>
            )}

            {/* Total and Add to Cart Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-nunito block">Total:</span>
                <span className="font-fredoka text-lg text-brand-pink font-bold">
                  Rp {previewTotalPrice.toLocaleString("id-ID")}
                </span>
              </div>

              <button
                type="button"
                disabled={isMixEnabled && previewSelections.length < minFlavorCount}
                className={`px-4 py-2 rounded-full text-white text-xs font-bold font-nunito shadow-sm transition-opacity ${
                  isMixEnabled && previewSelections.length < minFlavorCount
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-brand-pink hover:bg-brand-pink-dark"
                }`}
              >
                + Tambah ke Keranjang
              </button>
            </div>
          </div>
        </div>

        {/* ─── 4. Foto Produk ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <h2 className="font-fredoka text-base text-brand-dark-blue flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-pink" />
            <span>4. Foto Produk</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0 relative">
              <img
                src={imageUrl}
                alt="Pratinjau foto produk"
                className="w-full h-full object-cover"
                style={{ width: "96px", height: "96px", objectFit: "cover" }}
              />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-4 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-brand-pink text-xs font-bold font-nunito border border-pink-200 flex items-center gap-2 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? "Mengunggah..." : "Unggah Foto Produk"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={handleUploadImage}
                  />
                </label>
                <span className="text-[10px] text-slate-400">JPG, PNG, WebP (Maks. 5MB)</span>
              </div>
              <input
                type="text"
                placeholder="Atau URL foto produk..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 focus:outline-none focus:border-brand-pink bg-white"
              />
            </div>
          </div>
        </div>

        {/* ─── Form Submission Buttons ──────────────────────────────── */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/admin/produk"
            className="px-5 py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-colors shadow-pink-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Menyimpan ke Database..." : isNew ? "Tambah Menu ke Database" : "Simpan Perubahan Menu"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
