"use client";

import React, { useState, useEffect } from "react";
import { Truck, Store, Plus, Trash2, Save, Info, Check, MapPin, AlertCircle } from "lucide-react";
import { fetchDeliveryZones, adminSaveDeliveryZones } from "@/lib/supabase/services/settings";

export default function AdminPengirimanPage() {
  const [zones, setZones] = useState<any[]>([
    { id: 1, name: "Panakkukang & Rappocini", feeRange: "Rp 10.000 - Rp 15.000", notes: "Radius dekat outlet" },
    { id: 2, name: "Ujung Pandang & Makassar Kota", feeRange: "Rp 15.000 - Rp 20.000", notes: "Area pusat kota" },
    { id: 3, name: "Tamalate & Mamajang", feeRange: "Rp 15.000 - Rp 22.000", notes: "Makassar bagian selatan" },
    { id: 4, name: "Tamalanrea & Biringkanaya", feeRange: "Rp 25.000 - Rp 35.000", notes: "Area kampus & perintis" },
  ]);

  const [newZoneName, setNewZoneName] = useState("");
  const [newFeeRange, setNewFeeRange] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [pickupAddress, setPickupAddress] = useState("Jl. Boulevard No. 18, Panakkukang, Makassar");
  const [savedNotice, setSavedNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchDeliveryZones().then((data) => {
      if (data && data.length > 0) {
        setZones(
          data.map((d: any) => ({
            id: d.id,
            name: d.name,
            feeRange: d.fee_range,
            notes: d.notes,
          }))
        );
      }
    });
  }, []);

  const handleAddZone = () => {
    if (!newZoneName.trim() || !newFeeRange.trim()) return;
    setZones([
      ...zones,
      {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now(),
        name: newZoneName.trim(),
        feeRange: newFeeRange.trim(),
        notes: newNotes.trim() || "-",
      },
    ]);
    setNewZoneName("");
    setNewFeeRange("");
    setNewNotes("");
  };

  const handleRemoveZone = (id: any) => {
    setZones(zones.filter((z) => z.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorNotice("");

    try {
      await adminSaveDeliveryZones(zones);
      setSavedNotice("Pengaturan area & ongkir berhasil disimpan permanen di database Supabase.");
      setTimeout(() => setSavedNotice(""), 3000);
    } catch (err: any) {
      setErrorNotice(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue">
          Area Pengiriman & Aturan Ongkir
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm font-nunito">
          Atur wilayah pengiriman di Kota Makassar dan aturan biaya konfirmasi manual admin.
        </p>
      </div>

      {savedNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs font-bold font-nunito flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan area & ongkir berhasil disimpan sementara di browser (Mode Demo).</span>
        </div>
      )}

      {/* ─── Business Rule Explanatory Card ──────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
        <h2 className="font-fredoka text-base text-brand-dark-blue flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-pink" />
          <span>Aturan Biaya Pengiriman Usaha</span>
        </h2>
        <ul className="list-disc list-inside text-xs font-nunito text-slate-600 space-y-1">
          <li>
            <strong>Antar ke Alamat:</strong> Ongkos kirim dikonfirmasi oleh admin saat pesanan masuk, <em>bukan dianggap Rp 0</em>. Website menampilkan pesan &quot;Subtotal belum termasuk ongkir&quot;.
          </li>
          <li>
            <strong>Ambil Sendiri di Outlet:</strong> Pelanggan bebas biaya pengiriman (Rp 0).
          </li>
        </ul>
      </div>

      {/* ─── Pickup Settings ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <h2 className="font-fredoka text-base text-brand-dark-blue flex items-center gap-2">
          <Store className="w-4 h-4 text-emerald-600" />
          <span>Titik Pengambilan &quot;Ambil Sendiri&quot; (Bebas Ongkir)</span>
        </h2>
        <div>
          <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
            Lokasi Ambil di Makassar
          </label>
          <input
            type="text"
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink"
          />
        </div>
      </div>

      {/* ─── Delivery Zones Table ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-fredoka text-base text-brand-dark-blue flex items-center gap-2">
            <Truck className="w-4 h-4 text-brand-pink" />
            <span>Estimasi Tarif Area Makassar</span>
          </h2>
          <span className="text-xs text-slate-400 font-nunito">
            {zones.length} Area Terdaftar
          </span>
        </div>

        {zones.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs font-nunito border border-dashed rounded-xl">
            Belum ada area pengiriman yang diatur. Silakan tambah area di bawah.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {zones.map((zone) => (
              <div key={zone.id} className="py-3 flex items-center justify-between gap-4 text-xs font-nunito">
                <div>
                  <span className="font-bold text-slate-800 block text-sm">{zone.name}</span>
                  <span className="text-slate-400 text-[11px]">{zone.notes}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-brand-dark-blue bg-slate-100 px-2.5 py-1 rounded-lg">
                    {zone.feeRange}
                  </span>
                  <button
                    onClick={() => handleRemoveZone(zone.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Zone */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <span className="font-fredoka text-xs text-brand-dark-blue block">
            Tambah Wilayah / Kecamatan Baru:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Nama Kecamatan (contoh: Bontoala)"
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
            />
            <input
              type="text"
              placeholder="Perkiraan Tarif (Rp 15.000 - Rp 20.000)"
              value={newFeeRange}
              onChange={(e) => setNewFeeRange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
            />
            <button
              type="button"
              onClick={handleAddZone}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-brand-pink hover:text-white text-slate-700 text-xs font-bold font-nunito transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Area</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-colors shadow-pink-sm flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Pengaturan Pengiriman</span>
        </button>
      </div>
    </div>
  );
}
