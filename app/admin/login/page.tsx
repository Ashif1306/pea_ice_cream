"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, KeyRound, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal masuk ke dashboard admin.");
      }

      // Sesi berhasil dibuat dan tersimpan di cookie aman
      localStorage.setItem("pea_admin_token", "authenticated-" + Date.now());
      router.push("/admin");
    } catch (err: any) {
      setErrorMessage(err.message || "Email atau kata sandi tidak sesuai.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pink-50/50 flex flex-col items-center justify-center p-4 font-nunito">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-pink-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 ring-4 ring-pink-100 shadow-sm flex-shrink-0"
            style={{ width: "64px", height: "64px" }}
          >
            <Image
              src="/logo.jpg"
              alt="Logo Pea Ice Cream"
              width={64}
              height={64}
              className="w-full h-full object-cover"
              style={{ width: "64px", height: "64px", objectFit: "cover" }}
            />
          </div>
          <h1 className="font-fredoka text-2xl text-brand-dark-blue">
            Admin Panel
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            Pea Ice Cream Makassar • Autentikasi Supabase
          </p>
        </div>

        {/* Security Architecture Notice */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-6 text-slate-700 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-brand-pink flex-shrink-0 mt-0.5" />
          <div>
            <strong>Akses Administrator Terbatas:</strong>
            <p className="mt-0.5 text-slate-500">
              Tidak ada pendaftaran admin publik. Akun admin diverifikasi melalui tabel <code>admin_users</code> dengan otorisasi berbasis peran (RBAC).
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-2xl text-xs font-nunito flex items-start gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-dark-blue mb-1">
              Email Administrator
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="nama@peaicecream.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark-blue mb-1">
              Kata Sandi
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-full bg-brand-pink text-white font-nunito font-bold text-sm shadow-pink-sm hover:bg-brand-pink-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isLoading ? "Memverifikasi..." : "Masuk ke Admin Panel"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-pink-50 text-center">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-brand-pink font-nunito"
          >
            ← Kembali ke Website Pelanggan
          </Link>
        </div>
      </div>
    </div>
  );
}
