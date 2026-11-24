"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { DUMMY_PRODUCTS, Product } from "@/lib/dummy-data";
import { CUP_SIZE_LABELS } from "@/lib/constants";
import {
  adminFetchAllProducts,
  adminToggleProductAvailability,
  adminArchiveProduct,
} from "@/lib/supabase/services/products";
import {
  fetchCategories,
  adminSaveCategory,
  adminToggleCategoryStatus,
  adminDeleteCategory,
  ProductCategoryItem,
} from "@/lib/supabase/services/categories";
import {
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Search,
  AlertCircle,
  Sparkles,
  Package,
  FolderTree,
  Loader2,
  Info,
} from "lucide-react";

export default function AdminProdukPage() {
  const [activeTab, setActiveTab] = useState<"produk" | "kategori">("produk");

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Categories state
  const [categories, setCategories] = useState<ProductCategoryItem[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategoryItem | null>(null);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catOrder, setCatOrder] = useState(1);
  const [catIsActive, setCatIsActive] = useState(true);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryModalError, setCategoryModalError] = useState("");

  // Feedback notifications
  const [notice, setNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodData, catData] = await Promise.all([
        adminFetchAllProducts(),
        fetchCategories(false),
      ]);
      setProducts(prodData);
      setCategories(catData);
    } catch (err: any) {
      console.warn("Data fetch fallback:", err.message);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showMsg = (msg: string, isError = false) => {
    if (isError) {
      setErrorNotice(msg);
      setTimeout(() => setErrorNotice(""), 5000);
    } else {
      setNotice(msg);
      setTimeout(() => setNotice(""), 4000);
    }
  };

  // ─── Category Handlers ───────────────────────────────────────────────────────
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCatName("");
    setCatSlug("");
    setCatDesc("");
    setCatOrder(categories.length + 1);
    setCatIsActive(true);
    setCategoryModalError("");
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: ProductCategoryItem) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDesc(cat.description || "");
    setCatOrder(cat.orderIdx || 1);
    setCatIsActive(cat.isActive);
    setCategoryModalError("");
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setCategoryModalError("Nama kategori wajib diisi.");
      return;
    }

    setIsSavingCategory(true);
    setCategoryModalError("");

    try {
      const saved = await adminSaveCategory({
        id: editingCategory?.id,
        name: catName.trim(),
        slug: catSlug.trim() || undefined,
        description: catDesc.trim(),
        orderIdx: catOrder,
        isActive: catIsActive,
      });

      // Update state
      const exists = categories.some((c) => c.id === saved.id);
      const updated = exists
        ? categories.map((c) => (c.id === saved.id ? { ...c, ...saved } : c))
        : [...categories, saved];

      // Sort by orderIdx
      updated.sort((a, b) => (a.orderIdx || 1) - (b.orderIdx || 1));
      setCategories(updated);

      setIsCategoryModalOpen(false);
      showMsg(
        editingCategory
          ? `Kategori "${saved.name}" berhasil diperbarui di database.`
          : `Kategori "${saved.name}" berhasil dibuat.`
      );

      // Refresh product list to reflect any category updates
      adminFetchAllProducts().then((p) => setProducts(p)).catch(() => {});
    } catch (err: any) {
      setCategoryModalError(err.message || "Gagal menyimpan kategori.");
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleToggleCategoryActive = async (cat: ProductCategoryItem) => {
    const newStatus = !cat.isActive;
    try {
      await adminToggleCategoryStatus(cat.id, newStatus);
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: newStatus } : c))
      );
      showMsg(`Status kategori "${cat.name}" diubah ke ${newStatus ? "Aktif" : "Nonaktif"}.`);
    } catch (err: any) {
      showMsg(`Gagal mengubah status: ${err.message}`, true);
    }
  };

  const handleDeleteCategory = async (cat: ProductCategoryItem) => {
    if (!confirm(`Hapus kategori "${cat.name}"? Pastikan tidak ada produk yang menggunakan kategori ini.`)) {
      return;
    }

    try {
      await adminDeleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      showMsg(`Kategori "${cat.name}" berhasil dihapus.`);
    } catch (err: any) {
      showMsg(err.message || "Gagal menghapus kategori.", true);
    }
  };

  // ─── Products Handlers ───────────────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== "all") {
      const matchSlug = p.category === categoryFilter;
      const matchId = p.categoryId === categoryFilter;
      if (!matchSlug && !matchId) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchFlavors = (p.flavors || []).some((f) => f.toLowerCase().includes(q));
      return matchName || matchFlavors;
    }
    return true;
  });

  const toggleAvailability = async (id: string, currentVal: boolean) => {
    const newVal = !currentVal;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isAvailable: newVal } : p))
    );
    try {
      await adminToggleProductAvailability(id, newVal);
      showMsg(`Status ketersediaan berhasil diubah ke ${newVal ? "Tersedia" : "Habis"}.`);
    } catch (err: any) {
      showMsg(`Gagal update status: ${err.message}`, true);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(`Arsipkan menu "${name}"? Menu yang diarsipkan tidak akan tampil di katalog pelanggan tetapi riwayat pesanan tetap terjaga.`)) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      try {
        await adminArchiveProduct(id);
        showMsg(`Menu "${name}" berhasil diarsipkan (soft delete).`);
      } catch (err: any) {
        showMsg(`Gagal mengarsipkan: ${err.message}`, true);
      }
    }
  };

  const getCategoryDisplayName = (p: Product) => {
    if (p.categoryId) {
      const found = categories.find((c) => c.id === p.categoryId);
      if (found) return found.name;
    }
    if (p.category) {
      const found = categories.find((c) => c.slug === p.category);
      if (found) return found.name;
    }
    return p.categoryName || p.category || "Tanpa Kategori";
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Tabs Navigation ──────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("produk")}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-nunito transition-colors flex items-center gap-1.5 ${
            activeTab === "produk"
              ? "bg-brand-pink text-white shadow-sm"
              : "text-slate-500 hover:text-brand-pink hover:bg-pink-50"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Daftar Produk & Menu ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("kategori")}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-nunito transition-colors flex items-center gap-1.5 ${
            activeTab === "kategori"
              ? "bg-brand-pink text-white shadow-sm"
              : "text-slate-500 hover:text-brand-pink hover:bg-pink-50"
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Kelola Kategori ({categories.length})</span>
        </button>

        <Link
          href="/admin/rasa"
          className="px-4 py-2 rounded-xl text-xs font-bold font-nunito transition-colors flex items-center gap-1.5 text-slate-500 hover:text-brand-pink hover:bg-pink-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>Master Pilihan Rasa</span>
        </Link>
      </div>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs font-bold font-nunito flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-2xl text-xs font-bold font-nunito flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: DAFTAR PRODUK & MENU
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "produk" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue">
                Manajemen Produk & Menu
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm font-nunito">
                Kelola katalog es krim satu per satu ke dalam kategori, atur harga, foto, dan opsi mix rasa.
              </p>
            </div>

            <Link
              href="/admin/produk/new"
              className="px-4 py-2.5 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-colors shadow-sm flex items-center justify-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Menu Baru</span>
            </Link>
          </div>

          {/* Search & Dynamic Category Filter */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari menu es krim..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-nunito text-slate-700 focus:outline-none focus:border-brand-pink bg-white"
            >
              <option value="all">Semua Kategori ({products.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name} {!c.isActive ? "(Nonaktif)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Product Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-nunito">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Menu</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Opsi Mix Rasa</th>
                    <th className="px-4 py-3">Harga</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0"
                            style={{ width: "40px", height: "40px", minWidth: "40px", minHeight: "40px" }}
                          >
                            <Image
                              src={prod.images[0] || "/placeholder-ice-cream.jpg"}
                              alt={prod.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-fredoka text-sm text-brand-dark-blue block">
                              {prod.name}
                            </span>
                            {prod.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                                {prod.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full bg-pink-50 text-brand-dark-blue font-bold text-[10px] border border-pink-100">
                          {getCategoryDisplayName(prod)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {prod.isMixEnabled ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              Mix Aktif ({prod.minFlavorCount || 1}–{prod.maxFlavorCount || 2} rasa)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">
                            Nonaktif (Rasa Tunggal)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-fredoka font-bold text-brand-pink text-sm">
                        Rp {prod.basePrice.toLocaleString("id-ID")}
                      </td>

                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleAvailability(prod.id, prod.isAvailable)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                            prod.isAvailable
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {prod.isAvailable ? "Tersedia" : "Habis"}
                        </button>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/produk/${prod.id}`}
                            className="p-1.5 text-slate-400 hover:text-brand-pink transition-colors rounded-lg hover:bg-slate-100"
                            title="Edit Menu"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                            title="Arsipkan Menu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        Belum ada produk yang cocok dengan pencarian atau filter kategori.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: KELOLA KATEGORI PRODUK
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "kategori" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue">
                Kelola Kategori Produk
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm font-nunito">
                Buat dan atur kategori sendiri (misal: <em>Cup 120 ml</em>, <em>Cone</em>, <em>Family Pack</em>).
                Setiap kategori menampung produk yang dimasukkan satu per satu.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateCategory}
              className="px-4 py-2.5 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-colors shadow-sm flex items-center justify-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kategori Baru</span>
            </button>
          </div>

          {/* Explanation Alert */}
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-2xl text-xs font-nunito flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <strong className="block font-bold">Relasi Stabil Antara Produk dan Kategori:</strong>
              <p>
                Mengubah nama kategori tidak akan memutus hubungan dengan produk yang sudah ada di dalamnya.
                Kategori yang masih memiliki produk tidak dapat dihapus secara langsung; Anda dapat menonaktifkannya
                atau memindahkan produk terlebih dahulu.
              </p>
            </div>
          </div>

          {/* Categories Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-nunito">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-16 text-center">Urutan</th>
                    <th className="px-4 py-3">Nama Kategori</th>
                    <th className="px-4 py-3">Slug (Identitas)</th>
                    <th className="px-4 py-3">Deskripsi</th>
                    <th className="px-4 py-3 text-center">Jumlah Produk</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-center font-bold text-slate-500">
                        {cat.orderIdx || 1}
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-bold text-brand-dark-blue text-sm">
                          {cat.name}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <code className="text-[11px] text-pink-700 bg-pink-50 px-2 py-0.5 rounded font-mono">
                          {cat.slug}
                        </code>
                      </td>

                      <td className="px-4 py-3 text-slate-500 text-[11px] max-w-xs">
                        {cat.description || "-"}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {cat.productCount ?? 0} produk
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleCategoryActive(cat)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                            cat.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {cat.isActive ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditCategory(cat)}
                            className="p-1.5 text-slate-400 hover:text-brand-pink transition-colors rounded-lg hover:bg-slate-100"
                            title="Edit Kategori"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        Belum ada kategori yang dibuat. Klik tombol &quot;Tambah Kategori Baru&quot; di atas untuk membuat kategori pertama Anda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Form Tambah / Edit Kategori ─────────────────────── */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl border border-pink-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-fredoka text-xl text-brand-dark-blue">
                {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
              </h2>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {categoryModalError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-nunito flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{categoryModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs font-nunito">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Kategori *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Cup 120 ml, Cone, Signature"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-pink text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Slug URL (Identitas Stabil)
                </label>
                <input
                  type="text"
                  placeholder="Opsional (Otomatis dibuat jika kosong)"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-pink text-xs font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Perubahan nama tidak wajib mengubah slug untuk menjaga kestabilan URL & relasi.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Deskripsi Kategori (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat tentang kelompok menu ini..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-pink text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Urutan Tampilan
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={catOrder}
                    onChange={(e) => setCatOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-pink text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status Kategori
                  </label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catIsActive}
                      onChange={(e) => setCatIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-pink focus:ring-brand-pink"
                    />
                    <span className="text-xs font-medium text-slate-700">
                      Aktif di Katalog
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  disabled={isSavingCategory}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="px-5 py-2 rounded-xl bg-brand-pink text-white hover:bg-brand-pink-dark transition-colors text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  {isSavingCategory ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <span>Simpan Kategori</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
