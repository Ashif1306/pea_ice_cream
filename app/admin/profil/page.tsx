"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Store,
  Save,
  AlertCircle,
  Clock,
  MapPin,
  MessageCircle,
  Check,
  Upload,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  fetchStoreProfile,
  adminSaveStoreProfile,
  getWhatsAppLink,
  getInstagramLink,
  getTikTokLink,
} from "@/lib/supabase/services/settings";
import {
  DEFAULT_OUTLETS,
  OutletLocation,
  getStoredOutlets,
  saveStoredOutlets,
  getOutletStatus,
  formatHoursString,
} from "@/lib/outlets-data";

export default function AdminProfilPage() {
  const [businessName, setBusinessName] = useState("Pea Ice Cream");
  const [city, setCity] = useState("Makassar, Sulawesi Selatan");
  const [address, setAddress] = useState("Jl. Sungai Kelara 38, Makassar");
  const [hours, setHours] = useState("Everyday 10.00 – 18.00 WITA");
  const [mainOpenTime, setMainOpenTime] = useState("10:00");
  const [mainCloseTime, setMainCloseTime] = useState("18:00");
  const [whatsappNumber, setWhatsappNumber] = useState("081234567890");
  const [whatsappMessage, setWhatsappMessage] = useState("Halo Pea Ice Cream, saya ingin bertanya tentang menu es krim dan pemesanan.");
  const [instagram, setInstagram] = useState("@pea.icecream");
  const [tiktok, setTiktok] = useState("@pea.icecream");
  const [emailContact, setEmailContact] = useState("peaicecream@gmail.com");
  const [logoUrl, setLogoUrl] = useState("/logo.jpg");

  // Multi-Outlet Locations
  const [outlets, setOutlets] = useState<OutletLocation[]>(DEFAULT_OUTLETS);
  const [editingOutlet, setEditingOutlet] = useState<OutletLocation | null>(null);
  const [isOutletModalOpen, setIsOutletModalOpen] = useState(false);

  // Editable Taglines
  const [tagline1, setTagline1] = useState("ice cream classic");
  const [tagline2, setTagline2] = useState("homemade ice cream");
  const [tagline3, setTagline3] = useState("sehat tanpa pengawet");

  const [savedNotice, setSavedNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchStoreProfile().then((data) => {
      if (data) {
        setBusinessName(data.businessName);
        setCity(data.city);
        if (data.address) setAddress(data.address);
        if (data.hours) setHours(data.hours);
        if (data.whatsappNumber) setWhatsappNumber(data.whatsappNumber);
        if (data.whatsappMessage) setWhatsappMessage(data.whatsappMessage);
        if (data.instagram) setInstagram(data.instagram);
        if (data.tiktok) setTiktok(data.tiktok);
        if (data.email) setEmailContact(data.email);
        setTagline1(data.tagline1);
        setTagline2(data.tagline2);
        setTagline3(data.tagline3);
        if (data.logoUrl) setLogoUrl(data.logoUrl);
      }
    });

    const stored = getStoredOutlets();
    setOutlets(stored);
    const main = stored.find((o) => o.type === "main");
    if (main) {
      if (main.openTime) setMainOpenTime(main.openTime);
      if (main.closeTime) setMainCloseTime(main.closeTime);
      if (main.address) setAddress(main.address);
    }
  }, []);

  const handleMainOpenTimeChange = (newOpen: string) => {
    setMainOpenTime(newOpen);
    const formatted = formatHoursString(newOpen, mainCloseTime, "Everyday");
    setHours(formatted);
    setOutlets((prev) =>
      prev.map((o) =>
        o.type === "main" ? { ...o, openTime: newOpen, hours: formatted } : o
      )
    );
  };

  const handleMainCloseTimeChange = (newClose: string) => {
    setMainCloseTime(newClose);
    const formatted = formatHoursString(mainOpenTime, newClose, "Everyday");
    setHours(formatted);
    setOutlets((prev) =>
      prev.map((o) =>
        o.type === "main" ? { ...o, closeTime: newClose, hours: formatted } : o
      )
    );
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "branding");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal upload logo");

      setLogoUrl(data.url);
      setSavedNotice("Logo berhasil diunggah ke Supabase Storage!");
      setTimeout(() => setSavedNotice(""), 3000);
    } catch (err: any) {
      setErrorMessage(`Upload error: ${err.message}`);
      setTimeout(() => setErrorMessage(""), 4000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenAddOutlet = () => {
    setEditingOutlet({
      id: crypto.randomUUID ? crypto.randomUUID() : `outlet-${Date.now()}`,
      name: "",
      type: "branch",
      address: "Makassar",
      detailLocation: "",
      city: "Makassar",
      openTime: "10:00",
      closeTime: "22:00",
      hours: "Everyday 10.00 – 22.00 WITA",
      isActive: true,
      order: outlets.length + 1,
    });
    setIsOutletModalOpen(true);
  };

  const handleOpenEditOutlet = (outlet: OutletLocation) => {
    setEditingOutlet({
      ...outlet,
      openTime: outlet.openTime || "10:00",
      closeTime: outlet.closeTime || (outlet.type === "main" ? "18:00" : "22:00"),
      hours: outlet.hours || formatHoursString(outlet.openTime || "10:00", outlet.closeTime || "22:00", "Everyday"),
    });
    setIsOutletModalOpen(true);
  };

  const handleSaveOutletModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOutlet || !editingOutlet.name.trim()) return;

    const open = editingOutlet.openTime || "10:00";
    const close = editingOutlet.closeTime || (editingOutlet.type === "main" ? "18:00" : "22:00");
    const autoHours = formatHoursString(open, close, "Everyday");

    const preparedOutlet: OutletLocation = {
      ...editingOutlet,
      openTime: open,
      closeTime: close,
      hours: editingOutlet.hours?.trim() ? editingOutlet.hours : autoHours,
    };

    const exists = outlets.some((o) => o.id === preparedOutlet.id);
    let updated: OutletLocation[];
    if (exists) {
      updated = outlets.map((o) => (o.id === preparedOutlet.id ? preparedOutlet : o));
    } else {
      updated = [...outlets, preparedOutlet];
    }
    setOutlets(updated);
    saveStoredOutlets(updated);
    setIsOutletModalOpen(false);
    setEditingOutlet(null);
  };

  const handleDeleteOutlet = (id: string) => {
    const updated = outlets.filter((o) => o.id !== id);
    setOutlets(updated);
    saveStoredOutlets(updated);
  };

  const handleToggleOutletActive = (id: string) => {
    const updated = outlets.map((o) => (o.id === id ? { ...o, isActive: !o.isActive } : o));
    setOutlets(updated);
    saveStoredOutlets(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    try {
      saveStoredOutlets(outlets);
      await adminSaveStoreProfile({
        businessName,
        tagline1,
        tagline2,
        tagline3,
        description: "Es krim artisan premium dengan cita rasa lokal dan internasional. Homemade ice cream Makassar.",
        whatsappNumber,
        whatsappMessage,
        instagram,
        tiktok,
        email: emailContact,
        address,
        city,
        hours,
        logoUrl,
      });
      setSavedNotice("Profil usaha, alamat toko, dan daftar outlet berhasil disimpan ke database!");
      setTimeout(() => setSavedNotice(""), 3500);
    } catch (err: any) {
      setErrorMessage(`Gagal menyimpan ke Supabase: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue">
          Profil Usaha & Identitas
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm font-nunito">
          Kelola informasi identitas, logo, alamat outlet di Makassar, jam operasional, kontak, dan tagline.
        </p>
      </div>

      {savedNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold font-nunito flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{savedNotice}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* ─── 1. Logo & Identitas Utama ─────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-fredoka text-base text-brand-dark-blue">
            1. Identitas Brand & Logo Asli
          </h2>

          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-pink-100 shadow-sm flex-shrink-0"
              style={{ width: "64px", height: "64px" }}
            >
              <Image
                src="/logo.jpg"
                alt="Logo Asli Pea Ice Cream"
                width={64}
                height={64}
                className="w-full h-full object-cover"
                style={{ width: "64px", height: "64px", objectFit: "cover" }}
              />
            </div>
            <div>
              <span className="font-fredoka text-base text-brand-dark-blue block">
                Logo Utama (Tersedia di public/logo.jpg)
              </span>
              <span className="text-[11px] text-slate-500 font-nunito block">
                Aturan: Menggunakan logo asli, bukan teks buatan. Ukuran file 1080x1080px.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
              Nama Usaha
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink"
              required
            />
          </div>
        </div>

        {/* ─── 2. Pengaturan Tagline (Editable + Verification Note) ──── */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-fredoka text-base text-brand-dark-blue">
              2. Tagline Usaha (Konten Dapat Diedit)
            </h2>
            <span className="text-[11px] text-slate-400 font-nunito">Tampil di Beranda</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
              Tagline 1
            </label>
            <input
              type="text"
              value={tagline1}
              onChange={(e) => setTagline1(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
              Tagline 2
            </label>
            <input
              type="text"
              value={tagline2}
              onChange={(e) => setTagline2(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 font-nunito">
                Tagline 3
              </label>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Perlu Verifikasi Pemilik
              </span>
            </div>
            <input
              type="text"
              value={tagline3}
              onChange={(e) => setTagline3(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink"
            />

            {/* MANDATORY BRIEF REQUIREMENT: Verification note */}
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-nunito flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Catatan Verifikasi Konten:</strong>
                <p className="mt-0.5">
                  Klaim <em>&quot;sehat tanpa pengawet&quot;</em> wajib diverifikasi terlebih dahulu oleh pemilik usaha terkait sertifikasi/komposisi bahan sebelum dipublikasikan secara resmi ke materi promosi publik.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 3. Lokasi Main Store & Daftar Outlet Makassar ─────────── */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-fredoka text-base text-brand-dark-blue flex items-center gap-2">
                <Store className="w-4 h-4 text-brand-pink" />
                <span>3. Lokasi Main Store & Cabang Outlet Makassar ({outlets.length} Titik)</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-nunito mt-0.5">
                Kelola alamat toko utama dan seluruh booth outlet di mall-mall Makassar untuk titik ambil pesanan pelanggan.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddOutlet}
              className="px-3.5 py-1.5 rounded-full bg-pink-50 hover:bg-brand-pink hover:text-white text-brand-pink text-xs font-bold font-nunito border border-pink-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Outlet Baru</span>
            </button>
          </div>

          {/* Main Store Form */}
          <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-dark-blue font-nunito flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-pink" />
                <span>Alamat Toko Utama (Main Store):</span>
              </span>
              <span className="text-[10px] font-bold text-brand-pink bg-white px-2 py-0.5 rounded-full border border-pink-200">
                Pusat Produksi
              </span>
            </div>

            <div>
              <input
                type="text"
                value={address}
                placeholder="Jl. Sungai Kelara 38, Makassar"
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 font-nunito mb-1">
                  Kota / Wilayah
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 font-nunito">
                  Jam Buka & Tutup Main Store (WITA)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5 font-nunito">Jam Buka</span>
                    <input
                      type="time"
                      value={mainOpenTime}
                      onChange={(e) => handleMainOpenTimeChange(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5 font-nunito">Jam Tutup</span>
                    <input
                      type="time"
                      value={mainCloseTime}
                      onChange={(e) => handleMainCloseTimeChange(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Status Card for Main Store */}
            {(() => {
              const mainStatus = getOutletStatus({
                openTime: mainOpenTime,
                closeTime: mainCloseTime,
                type: "main",
              });
              return (
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-nunito ${mainStatus.badgeBg} ${mainStatus.badgeTextColor}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${mainStatus.dotColor} ${
                        mainStatus.isOpen ? "animate-pulse" : ""
                      }`}
                    />
                    <span className="font-bold">
                      Status Main Store Saat Ini: {mainStatus.statusText}
                    </span>
                    <span className="opacity-80">({mainStatus.timeNote})</span>
                  </div>
                  <span className="text-[10px] font-semibold opacity-75">
                    Waktu Pengguna: {mainStatus.currentTimeString} WITA
                  </span>
                </div>
              );
            })()}
          </div>

          {/* List of Outlets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 font-nunito mb-2">
              Daftar Seluruh Titik Outlet & Booth Mall:
            </label>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
              {outlets.map((outlet) => {
                const isMain = outlet.type === "main";
                const outletStatus = getOutletStatus(outlet);
                return (
                  <div
                    key={outlet.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-pink-100/70 flex items-center justify-center text-brand-pink flex-shrink-0 mt-0.5">
                        <Store className="w-4 h-4 text-brand-pink" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="font-fredoka text-sm text-brand-dark-blue truncate">
                            {outlet.name}
                          </strong>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.2 rounded-full ${
                              isMain
                                ? "bg-brand-pink text-white"
                                : "bg-pink-100 text-brand-pink"
                            }`}
                          >
                            {isMain ? "Main Store" : "Outlet Mall"}
                          </span>
                          
                          {/* Real-time status pill */}
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${outletStatus.badgeBg} ${outletStatus.badgeTextColor}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${outletStatus.dotColor} ${outletStatus.isOpen ? "animate-pulse" : ""}`} />
                            <span>{outletStatus.statusText}</span>
                            <span className="font-normal opacity-80">
                              ({(outlet.openTime || "10:00").replace(":", ".")} – {(outlet.closeTime || "22:00").replace(":", ".")})
                            </span>
                          </span>
                        </div>
                        {outlet.detailLocation && (
                          <span className="text-[11px] font-semibold text-brand-pink block mt-0.5">
                            {outlet.detailLocation}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 block truncate">
                          {outlet.address} • <span className="text-amber-700 font-semibold">{outlet.hours}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleOutletActive(outlet.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                          outlet.isActive !== false
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {outlet.isActive !== false ? "Aktif" : "Nonaktif"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditOutlet(outlet)}
                        className="p-1.5 text-slate-500 hover:text-brand-pink hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Outlet"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!isMain && (
                        <button
                          type="button"
                          onClick={() => handleDeleteOutlet(outlet.id)}
                          className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Outlet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── 4. Kontak WhatsApp & Media Sosial ─────────────────────── */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-fredoka text-base text-brand-dark-blue flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-brand-pink" />
              <span>4. Kontak WhatsApp & Media Sosial</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-nunito mt-0.5">
              Atur nomor WhatsApp resmi, template pesan obrolan, akun Instagram, TikTok, dan email yang tampil di footer dan seluruh website pelanggan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* WhatsApp Number */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 font-nunito">
                Nomor WhatsApp Bisnis Toko *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="0812xxxxxxxx atau 62812xxxxxxxx"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink bg-white"
                />
                <a
                  href={getWhatsAppLink(whatsappNumber, whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold font-nunito transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap"
                  title="Tes buka WhatsApp di tab baru"
                >
                  <span>Tes WA</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <span className="text-[10px] text-slate-400 font-nunito block">
                Digunakan untuk tombol chat bantuan dan konfirmasi checkout pesanan.
              </span>
            </div>

            {/* Email Kontak */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 font-nunito">
                Email Kontak Toko
              </label>
              <input
                type="email"
                value={emailContact}
                onChange={(e) => setEmailContact(e.target.value)}
                placeholder="peaicecream@gmail.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink bg-white"
              />
              <span className="text-[10px] text-slate-400 font-nunito block">
                Email resmi toko untuk pertanyaan kerjasama atau pelanggan.
              </span>
            </div>
          </div>

          {/* WhatsApp Greeting Message */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 font-nunito">
              Template Pesan Otomatis WhatsApp (Greeting Pelanggan)
            </label>
            <textarea
              rows={2}
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              placeholder="Halo Pea Ice Cream, saya ingin bertanya tentang menu es krim dan pemesanan."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink bg-white"
            />
            <span className="text-[10px] text-slate-400 font-nunito block">
              Teks ini otomatis terisi di kolom chat WhatsApp ketika pelanggan menekan tombol WhatsApp di footer atau tombol bantuan.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Instagram */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 font-nunito">
                Akun Instagram Resmi
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@pea.icecream"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink bg-white"
                />
                <a
                  href={getInstagramLink(instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 text-xs font-bold font-nunito transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap"
                  title="Tes buka Instagram di tab baru"
                >
                  <span>Lihat</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <span className="text-[10px] text-slate-400 font-nunito block">
                Ditampilkan pada tautan sosial media di footer dan profil usaha.
              </span>
            </div>

            {/* TikTok */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 font-nunito">
                Akun TikTok Resmi
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="@pea.icecream"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink bg-white"
                />
                <a
                  href={getTikTokLink(tiktok)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold font-nunito transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap"
                  title="Tes buka TikTok di tab baru"
                >
                  <span>Lihat</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <span className="text-[10px] text-slate-400 font-nunito block">
                Ditampilkan pada icon TikTok di footer toko es krim.
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-colors shadow-pink-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Menyimpan..." : "Simpan Profil Usaha & Outlet"}</span>
          </button>
        </div>
      </form>

      {/* ─── Modal Tambah / Edit Outlet ─────────────────────────── */}
      {isOutletModalOpen && editingOutlet && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-fredoka text-lg text-brand-dark-blue">
                {outlets.some((o) => o.id === editingOutlet.id)
                  ? "Edit Data Outlet"
                  : "Tambah Outlet Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsOutletModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOutletModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                  Nama Outlet / Cabang *
                </label>
                <input
                  type="text"
                  required
                  value={editingOutlet.name}
                  onChange={(e) =>
                    setEditingOutlet({ ...editingOutlet, name: e.target.value })
                  }
                  placeholder="Misal: Mall Nipah atau Main Store"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                    Tipe Outlet
                  </label>
                  <select
                    value={editingOutlet.type}
                    onChange={(e) =>
                      setEditingOutlet({
                        ...editingOutlet,
                        type: e.target.value as "main" | "branch",
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink bg-white"
                  >
                    <option value="main">Main Store (Toko Utama)</option>
                    <option value="branch">Outlet Mall / Cabang</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                    Kota
                  </label>
                  <input
                    type="text"
                    value={editingOutlet.city}
                    onChange={(e) =>
                      setEditingOutlet({ ...editingOutlet, city: e.target.value })
                    }
                    placeholder="Makassar"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                  Detail Posisi / Landmark
                </label>
                <input
                  type="text"
                  value={editingOutlet.detailLocation || ""}
                  onChange={(e) =>
                    setEditingOutlet({
                      ...editingOutlet,
                      detailLocation: e.target.value,
                    })
                  }
                  placeholder="Contoh: Lt. Basement (Depan Mr.DIY)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink"
                />
                <span className="text-[10px] text-slate-400 font-nunito mt-0.5 block">
                  Keterangan posisi lantai atau patokan toko agar pelanggan mudah menemukan gerai.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                  Alamat Lengkap / Jalan
                </label>
                <textarea
                  rows={2}
                  value={editingOutlet.address}
                  onChange={(e) =>
                    setEditingOutlet({ ...editingOutlet, address: e.target.value })
                  }
                  placeholder="Misal: Mall Nipah, Jl. Urip Sumoharjo No.23, Panaikang, Panakkukang"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink resize-none"
                />
              </div>

              {/* Jam Buka & Jam Tutup Real-time */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 font-nunito flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-brand-pink" />
                    <span>Jam Buka & Tutup Operasional *</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-nunito">WITA / Jam Makassar</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 font-nunito mb-1">
                      Jam Buka
                    </label>
                    <input
                      type="time"
                      required
                      value={editingOutlet.openTime || "10:00"}
                      onChange={(e) => {
                        const newOpen = e.target.value;
                        const close = editingOutlet.closeTime || "22:00";
                        setEditingOutlet({
                          ...editingOutlet,
                          openTime: newOpen,
                          hours: formatHoursString(newOpen, close, "Everyday"),
                        });
                      }}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 font-nunito mb-1">
                      Jam Tutup
                    </label>
                    <input
                      type="time"
                      required
                      value={editingOutlet.closeTime || "22:00"}
                      onChange={(e) => {
                        const newClose = e.target.value;
                        const open = editingOutlet.openTime || "10:00";
                        setEditingOutlet({
                          ...editingOutlet,
                          closeTime: newClose,
                          hours: formatHoursString(open, newClose, "Everyday"),
                        });
                      }}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink bg-white"
                    />
                  </div>
                </div>

                {/* Preset Cepat */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-500 font-nunito">Preset:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOutlet({
                        ...editingOutlet,
                        openTime: "10:00",
                        closeTime: "22:00",
                        hours: "Everyday 10.00 – 22.00 WITA",
                      });
                    }}
                    className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:border-brand-pink hover:text-brand-pink transition-colors"
                  >
                    Mall (10.00 – 22.00)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOutlet({
                        ...editingOutlet,
                        openTime: "10:00",
                        closeTime: "18:00",
                        hours: "Everyday 10.00 – 18.00 WITA",
                      });
                    }}
                    className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:border-brand-pink hover:text-brand-pink transition-colors"
                  >
                    Main Store (10.00 – 18.00)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOutlet({
                        ...editingOutlet,
                        openTime: "09:00",
                        closeTime: "21:00",
                        hours: "Everyday 09.00 – 21.00 WITA",
                      });
                    }}
                    className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:border-brand-pink hover:text-brand-pink transition-colors"
                  >
                    09.00 – 21.00
                  </button>
                </div>

                {/* Live Real-time Status Card inside Modal */}
                {(() => {
                  const modalStatus = getOutletStatus(editingOutlet);
                  return (
                    <div
                      className={`p-2.5 rounded-xl border text-xs font-nunito ${modalStatus.badgeBg} ${modalStatus.badgeTextColor}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${modalStatus.dotColor} ${
                              modalStatus.isOpen ? "animate-pulse" : ""
                            }`}
                          />
                          <span className="font-bold">
                            Status Saat Ini: {modalStatus.statusText}
                          </span>
                          <span className="opacity-80">({modalStatus.timeNote})</span>
                        </div>
                        <span className="text-[10px] font-semibold opacity-75">
                          Waktu Pengguna: {modalStatus.currentTimeString} WITA
                        </span>
                      </div>
                      <p className="text-[10px] opacity-75 mt-1 leading-normal">
                        Status di website pelanggan akan otomatis menjadi{" "}
                        <strong className="text-emerald-800">Buka</strong> begitu jam pengguna memasuki pukul{" "}
                        {editingOutlet.openTime || "10:00"} dan menjadi{" "}
                        <strong className="text-rose-800">Tutup</strong> setelah pukul{" "}
                        {editingOutlet.closeTime || "22:00"}.
                      </p>
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 font-nunito mb-1">
                    Format Teks Jam di Website
                  </label>
                  <input
                    type="text"
                    value={editingOutlet.hours}
                    onChange={(e) =>
                      setEditingOutlet({ ...editingOutlet, hours: e.target.value })
                    }
                    placeholder="Everyday 10.00 – 22.00 WITA"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                  Tautan Google Maps (Opsional)
                </label>
                <input
                  type="url"
                  value={editingOutlet.googleMapsUrl || ""}
                  onChange={(e) =>
                    setEditingOutlet({
                      ...editingOutlet,
                      googleMapsUrl: e.target.value,
                    })
                  }
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="outletActive"
                  checked={editingOutlet.isActive !== false}
                  onChange={(e) =>
                    setEditingOutlet({
                      ...editingOutlet,
                      isActive: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-brand-pink focus:ring-brand-pink accent-brand-pink"
                />
                <label
                  htmlFor="outletActive"
                  className="text-xs font-bold text-slate-700 font-nunito select-none cursor-pointer"
                >
                  Tampilkan Outlet ini di Website & Pilihan Checkout Ambil Sendiri
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOutletModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold font-nunito text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-colors shadow-pink-sm"
                >
                  Simpan Outlet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
