"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Check,
  Search,
  Upload,
  AlertCircle,
  Archive,
  RefreshCw,
  Package,
} from "lucide-react";
import {
  MasterFlavor,
  adminFetchAllFlavors,
  adminSaveFlavor,
  adminToggleFlavorAvailability,
  adminArchiveFlavor,
} from "@/lib/supabase/services/flavors";

export default function AdminRasaPage() {
  const [flavors, setFlavors] = useState<MasterFlavor[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'available' | 'out_of_stock' | 'archived'
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlavor, setEditingFlavor] = useState<Partial<MasterFlavor> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadFlavors = async () => {
    setIsLoading(true);
    try {
      const data = await adminFetchAllFlavors();
      setFlavors(data);
    } catch (err: any) {
      console.warn("Gagal memuat rasa:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlavors();
  }, []);

  const showMsg = (msg: string, isError = false) => {
    if (isError) {
      setErrorNotice(msg);
      setTimeout(() => setErrorNotice(""), 4000);
    } else {
      setNotice(msg);
      setTimeout(() => setNotice(""), 3500);
    }
  };

  const filteredFlavors = flavors.filter((f) => {
    if (filterStatus === "available" && (!f.isAvailable || !f.isActive)) return false;
    if (filterStatus === "out_of_stock" && (f.isAvailable || !f.isActive)) return false;
    if (filterStatus === "archived" && f.isActive) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return f.name.toLowerCase().includes(q) || (f.description || "").toLowerCase().includes(q);
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingFlavor({
      id: undefined,
      name: "",
      description: "",
      imageUrl: "",
      isAvailable: true,
      isActive: true,
      orderIdx: flavors.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (flavor: MasterFlavor) => {
    setEditingFlavor({ ...flavor });
    setIsModalOpen(true);
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingFlavor) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "flavors");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah foto rasa.");

      setEditingFlavor({ ...editingFlavor, imageUrl: data.url });
      showMsg("Foto rasa berhasil diunggah!");
    } catch (err: any) {
      showMsg(`Upload error: ${err.message}`, true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleAvailable = async (flavor: MasterFlavor) => {
    const newVal = !flavor.isAvailable;
    // Optimistic UI update
    setFlavors((prev) =>
      prev.map((f) => (f.id === flavor.id ? { ...f, isAvailable: newVal } : f))
    );

    try {
      await adminToggleFlavorAvailability(flavor.id, newVal);
      showMsg(`Status ketersediaan rasa "${flavor.name}" diubah ke ${newVal ? "Tersedia" : "Habis"}.`);
    } catch (err: any) {
      showMsg(`Gagal mengubah status: ${err.message}`, true);
      loadFlavors();
    }
  };

  const handleArchive = async (flavor: MasterFlavor) => {
    if (
      confirm(
        `Arsipkan rasa "${flavor.name}"?\n\nRasa ini akan dinonaktifkan dari pilihan produk baru, tetapi riwayat pesanan pelanggan masa lalu yang memilih rasa ini tetap aman dan tidak rusak.`
      )
    ) {
      // Optimistic UI update
      setFlavors((prev) =>
        prev.map((f) => (f.id === flavor.id ? { ...f, isActive: false } : f))
      );

      try {
        await adminArchiveFlavor(flavor.id);
        showMsg(`Rasa "${flavor.name}" berhasil diarsipkan (soft delete).`);
      } catch (err: any) {
        showMsg(`Gagal mengarsipkan rasa: ${err.message}`, true);
        loadFlavors();
      }
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlavor || !editingFlavor.name?.trim()) {
      showMsg("Nama rasa wajib diisi.", true);
      return;
    }

    setIsSaving(true);
    try {
      const saved = await adminSaveFlavor(editingFlavor);
      showMsg(`Rasa "${saved.name}" berhasil disimpan!`);
      setIsModalOpen(false);
      setEditingFlavor(null);
      loadFlavors();
    } catch (err: any) {
      showMsg(`Gagal menyimpan: ${err.message}`, true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Tabs Navigation ──────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <Link
          href="/admin/produk"
          className="px-4 py-2 rounded-xl text-xs font-bold font-nunito transition-colors flex items-center gap-1.5 text-slate-500 hover:text-brand-pink hover:bg-pink-50"
        >
          <Package className="w-4 h-4" />
          <span>Daftar Produk & Menu</span>
        </Link>
        <span className="px-4 py-2 rounded-xl text-xs font-bold font-nunito bg-brand-pink text-white shadow-sm flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>Master Pilihan Rasa ({flavors.filter((f) => f.isActive).length})</span>
        </span>
      </div>

      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue">
            Master Pilihan Rasa Es Krim
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-nunito mt-0.5">
            Kelola varian rasa es krim pusat. Satu rasa dapat dipakai pada banyak menu produk dengan pengaturan tambahan harga terpisah.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-colors shadow-sm flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Rasa Baru</span>
        </button>
      </div>

      {/* Notifications */}
      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs font-bold font-nunito flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-2xl text-xs font-bold font-nunito flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* ─── Filter & Search Bar ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama rasa es krim..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-nunito text-slate-700 focus:outline-none focus:border-brand-pink bg-white"
        >
          <option value="all">Semua Status Rasa</option>
          <option value="available">Hanya Tersedia (In Stock)</option>
          <option value="out_of_stock">Hanya Habis (Out of Stock)</option>
          <option value="archived">Diarsipkan / Nonaktif</option>
        </select>
      </div>

      {/* ─── Flavors Table ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-nunito">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-pink" />
            Memuat daftar master rasa...
          </div>
        ) : filteredFlavors.length === 0 ? (
          <div className="p-12 text-center">
            <Sparkles className="w-10 h-10 text-brand-pink/40 mx-auto mb-2" />
            <h3 className="font-fredoka text-base text-brand-dark-blue">
              Belum Ada Data Rasa
            </h3>
            <p className="text-slate-400 text-xs font-nunito max-w-sm mx-auto mt-1 mb-4">
              {search || filterStatus !== "all"
                ? "Tidak ada rasa yang cocok dengan pencarian atau filter yang dipilih."
                : "Daftar rasa es krim masih kosong. Anda dapat menambahkan rasa baru pertama Anda sekarang."}
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Rasa Baru</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-nunito">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">#</th>
                  <th className="px-4 py-3">Visual & Nama Rasa</th>
                  <th className="px-4 py-3">Deskripsi</th>
                  <th className="px-4 py-3 text-center">Ketersediaan</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFlavors.map((flavor) => (
                  <tr key={flavor.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Order Index */}
                    <td className="px-4 py-3.5 text-center text-slate-400 font-bold">
                      {flavor.orderIdx}
                    </td>

                    {/* Flavor Name & Photo */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-pink-50 border border-pink-100 flex-shrink-0 flex items-center justify-center">
                          {flavor.imageUrl ? (
                            <Image
                              src={flavor.imageUrl}
                              alt={flavor.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg">🍦</span>
                          )}
                        </div>
                        <div>
                          <span className="font-fredoka text-sm text-brand-dark-blue block font-medium">
                            {flavor.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            slug: {flavor.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3.5 max-w-xs text-slate-500 text-xs truncate">
                      {flavor.description || <span className="text-slate-300 italic">-</span>}
                    </td>

                    {/* Availability Toggle */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailable(flavor)}
                        disabled={!flavor.isActive}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all shadow-xs inline-flex items-center gap-1 ${
                          !flavor.isActive
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : flavor.isAvailable
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                        title="Klik untuk ubah status ketersediaan"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            flavor.isAvailable && flavor.isActive ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                          }`}
                        />
                        <span>{flavor.isAvailable && flavor.isActive ? "Tersedia" : "Habis"}</span>
                      </button>
                    </td>

                    {/* Active / Archived Status */}
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          flavor.isActive
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {flavor.isActive ? "Aktif" : "Diarsipkan"}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(flavor)}
                          className="p-1.5 text-slate-500 hover:text-brand-pink hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Rasa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {flavor.isActive && (
                          <button
                            type="button"
                            onClick={() => handleArchive(flavor)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Arsipkan Rasa (Aman untuk Riwayat Transaksi)"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Modal Form Tambah / Edit Rasa ────────────────────────── */}
      {isModalOpen && editingFlavor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-fredoka text-lg text-brand-dark-blue flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-pink" />
                  <span>{editingFlavor.id ? "Edit Data Rasa" : "Tambah Rasa Baru"}</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-nunito mt-0.5">
                  Informasi rasa ini akan tersedia untuk dihubungkan ke berbagai produk menu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 font-nunito mb-1.5">
                  Foto / Ikon Rasa (Opsional)
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-pink-50 border border-pink-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {editingFlavor.imageUrl ? (
                      <Image
                        src={editingFlavor.imageUrl}
                        alt="Preview Foto Rasa"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🍦</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="px-3.5 py-1.5 rounded-xl bg-pink-50 hover:bg-brand-pink hover:text-white text-brand-pink border border-pink-200 text-xs font-bold font-nunito cursor-pointer transition-colors inline-flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? "Mengunggah..." : "Pilih Foto"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadPhoto}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-slate-400 block font-nunito">
                      Format JPG, PNG, atau WEBP.
                    </span>
                  </div>
                </div>
              </div>

              {/* Nama Rasa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                  Nama Rasa *
                </label>
                <input
                  type="text"
                  required
                  value={editingFlavor.name || ""}
                  onChange={(e) => setEditingFlavor({ ...editingFlavor, name: e.target.value })}
                  placeholder="Misal: Belgian Dark Chocolate atau Strawberry Bliss"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                  Deskripsi Singkat (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={editingFlavor.description || ""}
                  onChange={(e) =>
                    setEditingFlavor({ ...editingFlavor, description: e.target.value })
                  }
                  placeholder="Penjelasan cita rasa es krim untuk pelanggan..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink"
                />
              </div>

              {/* Urutan & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                    Urutan Tampilan
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editingFlavor.orderIdx || 1}
                    onChange={(e) =>
                      setEditingFlavor({
                        ...editingFlavor,
                        orderIdx: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                    Status Ketersediaan
                  </label>
                  <select
                    value={editingFlavor.isAvailable ? "available" : "out_of_stock"}
                    onChange={(e) =>
                      setEditingFlavor({
                        ...editingFlavor,
                        isAvailable: e.target.value === "available",
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink bg-white"
                  >
                    <option value="available">Tersedia (In Stock)</option>
                    <option value="out_of_stock">Habis (Out of Stock)</option>
                  </select>
                </div>
              </div>

              {/* Toggle Aktif / Arsip */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 font-nunito block">
                    Status Aktif Katalog
                  </span>
                  <span className="text-[10px] text-slate-400 font-nunito block">
                    Jika nonaktif, rasa tidak muncul di pilihan produk baru.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editingFlavor.isActive !== false}
                  onChange={(e) =>
                    setEditingFlavor({ ...editingFlavor, isActive: e.target.checked })
                  }
                  className="w-4 h-4 accent-brand-pink rounded cursor-pointer"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold font-nunito text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-full bg-brand-pink hover:bg-brand-pink-dark text-white text-xs font-bold font-nunito transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Menyimpan..." : "Simpan Rasa"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
