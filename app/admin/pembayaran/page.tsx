"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { CreditCard, QrCode, Plus, Trash2, Upload, Save, Check, AlertCircle } from "lucide-react";
import { fetchPaymentMethods, adminSavePaymentMethods } from "@/lib/supabase/services/settings";

export default function AdminPembayaranPage() {
  const [bankAccounts, setBankAccounts] = useState<any[]>([
    { id: 1, type: "transfer", bank: "BCA", accountNumber: "1234567890", accountName: "Pea Ice Cream Makassar" },
  ]);

  const [newBank, setNewBank] = useState("");
  const [newAccNumber, setNewAccNumber] = useState("");
  const [newAccName, setNewAccName] = useState("");

  const [qrisImageUrl, setQrisImageUrl] = useState("");
  const [qrisConfigured, setQrisConfigured] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchPaymentMethods().then((data) => {
      if (data && data.length > 0) {
        const banks = data
          .filter((d) => d.type === "transfer")
          .map((d) => ({
            id: d.id,
            type: "transfer",
            bank: d.bank_name,
            accountNumber: d.account_number,
            accountName: d.account_name,
          }));
        if (banks.length > 0) setBankAccounts(banks);

        const qris = data.find((d) => d.type === "qris");
        if (qris) {
          setQrisConfigured(true);
          if (qris.qris_image_url) setQrisImageUrl(qris.qris_image_url);
        }
      }
    });
  }, []);

  const handleUploadQris = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "payment");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal upload QRIS");

      setQrisImageUrl(data.url);
      setQrisConfigured(true);
      setSavedNotice("Barcode QRIS berhasil diunggah ke Supabase Storage!");
      setTimeout(() => setSavedNotice(""), 3000);
    } catch (err: any) {
      setErrorNotice(`Upload QRIS error: ${err.message}`);
      setTimeout(() => setErrorNotice(""), 4000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddAccount = () => {
    if (!newBank.trim() || !newAccNumber.trim() || !newAccName.trim()) return;
    setBankAccounts([
      ...bankAccounts,
      {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now(),
        type: "transfer",
        bank: newBank.trim(),
        accountNumber: newAccNumber.trim(),
        accountName: newAccName.trim(),
      },
    ]);
    setNewBank("");
    setNewAccNumber("");
    setNewAccName("");
  };

  const handleRemoveAccount = (id: any) => {
    setBankAccounts(bankAccounts.filter((b) => b.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorNotice("");

    const allMethods = [
      ...bankAccounts.map((b) => ({
        id: b.id,
        type: "transfer",
        bank_name: b.bank,
        account_number: b.accountNumber,
        account_name: b.accountName,
      })),
      {
        id: "00000000-0000-0000-0000-000000000099",
        type: "qris",
        qris_image_url: qrisImageUrl || null,
        instructions: "Pindai QRIS dan transfer sesuai nominal",
      },
    ];

    try {
      await adminSavePaymentMethods(allMethods);
      setSavedNotice("Pengaturan rekening & QRIS berhasil disimpan permanen di database Supabase.");
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
          Pengaturan Rekening & QRIS
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm font-nunito">
          Kelola nomor rekening bank dan QRIS yang akan dikirimkan kepada pelanggan untuk pembayaran manual.
        </p>
      </div>

      {savedNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs font-bold font-nunito flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan pembayaran berhasil disimpan sementara di browser (Mode Demo).</span>
        </div>
      )}

      {/* ─── 1. Rekening Bank Transfer ─────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-fredoka text-base text-brand-dark-blue flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-pink" />
            <span>Daftar Rekening Bank</span>
          </h2>
          <span className="text-xs text-slate-400 font-nunito">
            {bankAccounts.length} Rekening Aktif
          </span>
        </div>

        {bankAccounts.length === 0 ? (
          /* Empty state with clear guidance */
          <div className="p-8 text-center text-slate-400 text-xs font-nunito border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <strong className="block text-slate-600 mb-1">Belum Ada Rekening Bank yang Diatur</strong>
            <p className="max-w-xs mx-auto">
              Tambahkan nomor rekening toko Anda di bawah agar pelanggan dapat melakukan transfer saat memilih metode bayar Transfer Bank.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {bankAccounts.map((acc) => (
              <div key={acc.id} className="py-3 flex items-center justify-between text-xs font-nunito">
                <div>
                  <span className="font-bold text-slate-800 text-sm block">
                    {acc.bank} • <span className="font-mono">{acc.accountNumber}</span>
                  </span>
                  <span className="text-slate-400">a.n {acc.accountName}</span>
                </div>
                <button
                  onClick={() => handleRemoveAccount(acc.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Account Form */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <span className="font-fredoka text-xs text-brand-dark-blue block">
            Tambah Rekening Bank Baru:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Nama Bank (BCA / Mandiri)"
              value={newBank}
              onChange={(e) => setNewBank(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
            />
            <input
              type="text"
              placeholder="Nomor Rekening"
              value={newAccNumber}
              onChange={(e) => setNewAccNumber(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink font-mono"
            />
            <input
              type="text"
              placeholder="Atas Nama"
              value={newAccName}
              onChange={(e) => setNewAccName(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
            />
          </div>
          <button
            type="button"
            onClick={handleAddAccount}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-brand-pink hover:text-white text-slate-700 text-xs font-bold font-nunito transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simpan Rekening ke Daftar</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Pengaturan Unggah QRIS ─────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <h2 className="font-fredoka text-base text-brand-dark-blue flex items-center gap-2">
          <QrCode className="w-4 h-4 text-brand-pink" />
          <span>Kode QRIS Toko</span>
        </h2>

        {!qrisConfigured ? (
          /* Empty state with clear guidance */
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50 flex flex-col items-center justify-center">
            <QrCode className="w-10 h-10 text-slate-300 mb-2" />
            <strong className="font-fredoka text-sm text-slate-700">Gambar QRIS Belum Diunggah</strong>
            <p className="text-[11px] text-slate-400 font-nunito mt-1 max-w-sm">
              Unggah file barcode QRIS resmi toko Anda (JPG/PNG). File QRIS akan disimpan ke Supabase Storage pada tahap backend.
            </p>
            <button
              onClick={() => setQrisConfigured(true)}
              className="mt-3 px-4 py-2 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold font-nunito flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Simulasikan Unggah QRIS Demo</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-pink-50/50 rounded-2xl border border-pink-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl border border-pink-200 flex items-center justify-center text-brand-pink">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <span className="font-fredoka text-sm text-brand-dark-blue block">
                  QRIS Pea Ice Cream Makassar
                </span>
                <span className="text-[11px] text-emerald-600 font-bold">
                  ✓ Siap Ditampilkan ke Pelanggan
                </span>
              </div>
            </div>
            <button
              onClick={() => setQrisConfigured(false)}
              className="text-xs text-red-500 hover:underline font-semibold"
            >
              Hapus QRIS
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-colors shadow-pink-sm flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Pengaturan Pembayaran</span>
        </button>
      </div>
    </div>
  );
}
