"use client";

import React, { useState } from "react";
import Image from "next/image";
import { UserCheck, ShieldCheck, Key, LogOut, Check, ServerOff, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminAkunPage() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("Administrator Pea");
  const [adminEmail, setAdminEmail] = useState("admin@peaicecream.com");
  const [newPassword, setNewPassword] = useState("");
  const [savedNotice, setSavedNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setErrorNotice("Kata sandi baru minimal 8 karakter.");
      return;
    }

    setIsChangingPass(true);
    setErrorNotice("");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah kata sandi.");

      setSavedNotice("Kata sandi berhasil diperbarui.");
      setNewPassword("");
      setTimeout(() => setSavedNotice(""), 3000);
    } catch (err: any) {
      setErrorNotice(err.message || "Gagal memperbarui kata sandi.");
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Logout error:", e);
    }
    localStorage.removeItem("pea_admin_token");
    router.push("/admin/login");
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue">
          Profil Akun Admin & Keamanan
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm font-nunito">
          Kelola profil pengguna admin operasional, keamanan akun, dan sesi login.
        </p>
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

      {/* ─── Security Architecture Notice ──── */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-800 text-xs font-nunito space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-brand-dark-blue">
          <ShieldCheck className="w-5 h-5 text-brand-pink flex-shrink-0" />
          <span>Arsitektur Autentikasi & Keamanan Supabase</span>
        </div>
        <p className="leading-relaxed text-slate-600">
          Autentikasi admin diamankan menggunakan <strong>Supabase Auth</strong> berbasis cookie terenkripsi HTTP-only. Akses ke setiap tabel dan fungsi database dilindungi oleh kebijakan <strong>Row Level Security (RLS)</strong>.
        </p>
        <div className="pt-2 border-t border-slate-200 flex items-start gap-2 text-slate-500">
          <ServerOff className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Prinsip Keamanan:</strong> Hosting, DNS domain, dan kredensial infrastruktur server <em>tidak dikelola</em> melalui dashboard operasional toko.
          </span>
        </div>
      </div>

      {/* ─── Profile & Session Info ──── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <h2 className="font-fredoka text-base text-brand-dark-blue">1. Informasi Akun Aktif</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
              Email Administrator
            </label>
            <input
              type="email"
              value={adminEmail}
              disabled
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-nunito bg-slate-50 text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* ─── Change Password ──── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <h2 className="font-fredoka text-base text-brand-dark-blue">2. Ubah Kata Sandi Akun</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
              Kata Sandi Baru (Minimal 8 Karakter)
            </label>
            <input
              type="password"
              placeholder="Masukkan kata sandi baru..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isChangingPass}
            className="px-5 py-2.5 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-colors shadow-pink-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Key className="w-4 h-4" />
            <span>{isChangingPass ? "Memperbarui..." : "Perbarui Kata Sandi"}</span>
          </button>
        </form>
      </div>

      {/* ─── Logout ──── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="font-fredoka text-base text-brand-dark-blue">Keluar dari Sesi Admin</h2>
          <p className="text-xs text-slate-400 font-nunito">Hapus cookie sesi aktif dari browser ini.</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="px-5 py-2.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold font-nunito flex items-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
