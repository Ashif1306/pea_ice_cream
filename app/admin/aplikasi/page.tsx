"use client";

import React, { useState, useEffect } from "react";
import {
  Share2,
  Plus,
  Trash2,
  Save,
  ExternalLink,
  Check,
  AlertCircle,
  Upload,
  ArrowUp,
  ArrowDown,
  Edit2,
  Eye,
  Smartphone,
} from "lucide-react";
import {
  fetchExternalApps,
  adminSaveExternalApps,
  getStoredExternalApps,
  saveStoredExternalApps,
} from "@/lib/supabase/services/settings";
import { DEFAULT_PARTNER_APPS, DeliveryAppItem, getAppVisual } from "@/components/home/apps-modal";

interface PresetOption {
  name: string;
  icon: string;
  defaultUrl: string;
  badge: string;
  description: string;
  color: string;
}

const PRESET_APPS: PresetOption[] = [
  {
    name: "GoFood",
    icon: "/apps/gofood.svg",
    defaultUrl: "https://gofood.link",
    badge: "Paling Populer",
    description: "Pesan es krim favoritmu lewat GoFood",
    color: "#EE2737",
  },
  {
    name: "GrabFood",
    icon: "/apps/grabfood.svg",
    defaultUrl: "https://food.grab.com",
    badge: "Banyak Promo",
    description: "Nikmati penawaran hemat di GrabFood",
    color: "#00B14F",
  },
  {
    name: "ShopeeFood",
    icon: "/apps/shopeefood.svg",
    defaultUrl: "https://shopee.co.id/now-food",
    badge: "Gratis Ongkir",
    description: "Voucher diskon & ongkir di ShopeeFood",
    color: "#EE4D2D",
  },
  {
    name: "Maxim Food",
    icon: "/apps/maxim.svg",
    defaultUrl: "https://taximaxim.com",
    badge: "Hemat",
    description: "Pengantaran praktis via Maxim Food",
    color: "#FFDD00",
  },
];

export default function AdminAplikasiPage() {
  const [apps, setApps] = useState<DeliveryAppItem[]>(DEFAULT_PARTNER_APPS);
  const [editingApp, setEditingApp] = useState<DeliveryAppItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // 1. Immediately read from localStorage
    setApps(getStoredExternalApps());

    // 2. Sync with Supabase
    fetchExternalApps().then((data) => {
      if (data && data.length > 0) {
        setApps(data);
      }
    });

    const handleExternalChange = () => {
      setApps(getStoredExternalApps());
    };
    window.addEventListener("pea_apps_changed", handleExternalChange);
    return () => window.removeEventListener("pea_apps_changed", handleExternalChange);
  }, []);

  const handleOpenAdd = () => {
    setEditingApp({
      id: crypto.randomUUID ? crypto.randomUUID() : `app-${Date.now()}`,
      name: "GoFood",
      url: "https://gofood.link",
      icon: "/apps/gofood.svg",
      badge: "Paling Populer",
      description: "Pesan es krim favoritmu lewat GoFood",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (app: DeliveryAppItem) => {
    setEditingApp({ ...app });
    setIsModalOpen(true);
  };

  const handleSelectPreset = (preset: PresetOption) => {
    if (!editingApp) return;
    setEditingApp({
      ...editingApp,
      name: preset.name,
      url: preset.defaultUrl,
      icon: preset.icon,
      badge: preset.badge,
      description: preset.description,
    });
  };

  const handleUploadIcon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingApp) return;

    // 1. Instant local preview via FileReader
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === "string") {
        setEditingApp((prev) => (prev ? { ...prev, icon: event.target!.result as string } : prev));
      }
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "apps");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah logo");

      if (data.url) {
        setEditingApp((prev) => (prev ? { ...prev, icon: data.url } : prev));
      }
      setSavedNotice("Logo aplikasi berhasil diunggah!");
      setTimeout(() => setSavedNotice(""), 3000);
    } catch (err: any) {
      console.warn("Upload api warning, keeping local preview:", err.message);
      setSavedNotice("Gambar logo terpilih dan siap disimpan.");
      setTimeout(() => setSavedNotice(""), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp || !editingApp.name.trim() || !editingApp.url.trim()) return;

    const exists = apps.some((a) => a.id === editingApp.id);
    let updated: DeliveryAppItem[];
    if (exists) {
      updated = apps.map((a) => (a.id === editingApp.id ? editingApp : a));
    } else {
      updated = [...apps, editingApp];
    }

    // Immediately save and update state
    setApps(updated);
    saveStoredExternalApps(updated);
    adminSaveExternalApps(updated).catch(() => {});

    setIsModalOpen(false);
    setEditingApp(null);
    setSavedNotice("Aplikasi dan logo berhasil disimpan dan diperbarui!");
    setTimeout(() => setSavedNotice(""), 3500);
  };

  const handleDeleteApp = (id?: string) => {
    if (!id) return;
    const updated = apps.filter((a) => a.id !== id);
    setApps(updated);
    saveStoredExternalApps(updated);
    adminSaveExternalApps(updated).catch(() => {});
  };

  const handleToggleActive = (id?: string) => {
    if (!id) return;
    const updated = apps.map((a) =>
      a.id === id ? { ...a, is_active: a.is_active === false ? true : false } : a
    );
    setApps(updated);
    saveStoredExternalApps(updated);
    adminSaveExternalApps(updated).catch(() => {});
  };

  const handleMoveOrder = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= apps.length) return;

    const list = [...apps];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    setApps(list);
    saveStoredExternalApps(list);
    adminSaveExternalApps(list).catch(() => {});
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setErrorNotice("");

    try {
      saveStoredExternalApps(apps);
      await adminSaveExternalApps(apps);
      setSavedNotice("Daftar aplikasi pemesanan dan logo berhasil disimpan!");
      setTimeout(() => setSavedNotice(""), 3500);
    } catch (err: any) {
      setErrorNotice(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue">
            Tautan Aplikasi Pemesanan Eksternal
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-nunito">
            Kelola pilihan aplikasi pengantaran makanan pihak ketiga (GoFood, GrabFood, ShopeeFood, Maxim, dll) yang muncul saat pelanggan mengklik &quot;Pesan via Aplikasi&quot;.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-colors shadow-pink-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Aplikasi Baru</span>
        </button>
      </div>

      {savedNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs font-bold font-nunito flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{savedNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-2xl text-xs font-bold font-nunito flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* ─── List of Configured Delivery Apps ──────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-brand-pink" />
            <h2 className="font-fredoka text-base text-brand-dark-blue">
              Daftar Aplikasi Aktif ({apps.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-nunito font-semibold">
            {apps.filter((a) => a.is_active !== false).length} aplikasi tayang di modal
          </span>
        </div>

        {apps.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs font-nunito">
            Belum ada aplikasi yang dikonfigurasi. Klik &quot;Tambah Aplikasi Baru&quot; di atas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-nunito">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-center">Urutan</th>
                  <th className="px-4 py-3">Logo & Nama Aplikasi</th>
                  <th className="px-4 py-3">Badge & Deskripsi</th>
                  <th className="px-4 py-3">Tautan URL Outlet</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {apps.map((app, idx) => {
                  const visual = getAppVisual(app.name, app.icon);
                  const isActive = app.is_active !== false;

                  return (
                    <tr key={app.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      {/* Urutan */}
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
                            {idx + 1}
                          </span>
                          <button
                            type="button"
                            disabled={idx === apps.length - 1}
                            onClick={() => handleMoveOrder(idx, "down")}
                            className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-600"
                            title="Pindah ke bawah"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Logo & Nama */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-2xs p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {visual.logo ? (
                              <img
                                src={visual.logo}
                                alt={app.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <span className="font-fredoka font-bold text-sm text-brand-dark-blue">
                                {app.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <strong className="block font-fredoka text-sm text-brand-dark-blue">
                              {app.name}
                            </strong>
                            <span className="text-[10px] text-slate-400">
                              {visual.logo ? "Logo resmi aktif" : "Ikon inisial"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Badge & Deskripsi */}
                      <td className="px-4 py-3 max-w-xs">
                        {app.badge && (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold mb-1 ${visual.badgeColor}`}>
                            {app.badge}
                          </span>
                        )}
                        <p className="text-[11px] text-slate-500 truncate">
                          {app.description || "Buka outlet Pea Ice Cream"}
                        </p>
                      </td>

                      {/* Tautan URL */}
                      <td className="px-4 py-3 max-w-xs truncate">
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-pink hover:underline font-mono flex items-center gap-1 truncate"
                        >
                          <span className="truncate">{app.url}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </td>

                      {/* Status Toggle */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(app.id)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {isActive ? "Aktif Tayang" : "Nonaktif"}
                        </button>
                      </td>

                      {/* Aksi */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(app)}
                            className="p-1.5 text-slate-500 hover:text-brand-pink hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Aplikasi"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteApp(app.id)}
                            className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Aplikasi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Live Preview Popup ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-fredoka text-base text-brand-dark-blue flex items-center gap-2">
            <Eye className="w-4 h-4 text-brand-pink" />
            <span>Pratinjau Tampilan di Popup Pelanggan (Pesan via Aplikasi)</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-nunito">
            Hasil tampilan saat pengunjung mengklik tombol di Hero Beranda
          </span>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 max-w-md mx-auto">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center text-brand-pink flex-shrink-0">
              <Smartphone className="w-4 h-4 text-brand-pink" />
            </div>
            <div>
              <h4 className="font-fredoka text-sm text-brand-dark-blue font-bold">
                Pesan via Aplikasi
              </h4>
              <p className="text-[10px] text-slate-500">
                Pilih aplikasi pesan antar makanan favoritmu:
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {apps
              .filter((a) => a.is_active !== false)
              .map((app, idx) => {
                const visual = getAppVisual(app.name, app.icon);
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${visual.bgColor} ${visual.borderColor}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {visual.logo ? (
                          <img
                            src={visual.logo}
                            alt={app.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="font-fredoka font-bold text-xs">
                            {app.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-fredoka text-xs font-bold text-brand-dark-blue truncate">
                            {app.name}
                          </span>
                          {app.badge && (
                            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full ${visual.badgeColor}`}>
                              {app.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {app.description || "Buka outlet Pea Ice Cream"}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold font-nunito flex items-center gap-0.5 ${visual.textColor}`}>
                      <span>Pesan</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* ─── Bottom Action Bar ────────────────────────────────────── */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-colors shadow-pink-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Menyimpan ke Database..." : "Simpan Seluruh Tautan Aplikasi"}</span>
        </button>
      </div>

      {/* ─── Modal Tambah / Edit Aplikasi ─────────────────────────── */}
      {isModalOpen && editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-pink-100 max-h-[92vh] overflow-y-auto">
            <h3 className="font-fredoka text-xl text-brand-dark-blue mb-1">
              {apps.some((a) => a.id === editingApp.id) ? "Edit Aplikasi Pemesanan" : "Tambah Aplikasi Pemesanan"}
            </h3>
            <p className="text-xs text-slate-400 font-nunito mb-4">
              Pilih template aplikasi populer (GoFood, GrabFood, ShopeeFood, Maxim) atau masukkan aplikasi kustom Anda.
            </p>

            {/* Quick Presets */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-700 font-nunito mb-1.5">
                Pilih Cepat Template Aplikasi:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_APPS.map((p) => {
                  const isSelected = editingApp.name.toLowerCase() === p.name.toLowerCase();
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        isSelected
                          ? "border-brand-pink bg-pink-50 ring-2 ring-brand-pink/30 shadow-xs"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <img src={p.icon} alt={p.name} className="w-6 h-6 object-contain" />
                      <span className="font-fredoka text-xs text-slate-800 font-bold truncate">
                        {p.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                  Nama Aplikasi / Layanan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: GoFood, GrabFood, Maxim"
                  value={editingApp.name}
                  onChange={(e) => setEditingApp({ ...editingApp, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                  Tautan URL Outlet Toko <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="Contoh: https://gofood.link/... atau https://food.grab.com/..."
                  value={editingApp.url}
                  onChange={(e) => setEditingApp({ ...editingApp, url: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 focus:outline-none focus:border-brand-pink"
                />
              </div>

              {/* Logo Selection & Custom Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                  Logo / Gambar Ikon Aplikasi
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {editingApp.icon ? (
                      <img src={editingApp.icon} alt="Preview icon" className="w-full h-full object-contain" />
                    ) : (
                      <Share2 className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Path / URL logo (contoh: /apps/gofood.svg)"
                      value={editingApp.icon || ""}
                      onChange={(e) => setEditingApp({ ...editingApp, icon: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 focus:outline-none focus:border-brand-pink mb-1"
                    />
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-brand-pink text-[11px] font-bold font-nunito border border-pink-200 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? "Mengunggah..." : "Unggah Gambar Logo Baru"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploading}
                        onChange={handleUploadIcon}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                    Label Badge Promo (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Paling Populer, Promo 30%"
                    value={editingApp.badge || ""}
                    onChange={(e) => setEditingApp({ ...editingApp, badge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                    Deskripsi Singkat (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pesan es krim via GoFood"
                    value={editingApp.description || ""}
                    onChange={(e) => setEditingApp({ ...editingApp, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-nunito font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingApp.is_active !== false}
                    onChange={(e) => setEditingApp({ ...editingApp, is_active: e.target.checked })}
                    className="rounded text-brand-pink focus:ring-brand-pink"
                  />
                  <span>Tampilkan aplikasi ini pada popup &quot;Pesan via Aplikasi&quot; di Beranda</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingApp(null);
                  }}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-colors shadow-pink-sm"
                >
                  Terapkan ke Daftar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
