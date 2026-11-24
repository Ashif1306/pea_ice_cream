"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, Clock, ChevronRight, AlertCircle } from "lucide-react";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export default function PesananIndexPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchRef, setSearchRef] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("pea_orders") || "[]");
      setOrders(stored);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRef.trim()) return;
    window.location.href = `/pesanan/${searchRef.trim()}`;
  };

  return (
    <div className="bg-pink-50/40 min-h-screen py-6 sm:py-10 pb-32 md:pb-16">
      <div className="container-brand max-w-2xl">
        <div className="mb-6">
          <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue">
            Pesanan Saya
          </h1>
          <p className="text-gray-500 font-nunito text-xs sm:text-sm">
            Pantau status pesanan es krim yang dibuat di perangkat ini atau cari nomor referensi.
          </p>
        </div>

        {/* Search by Reference */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Masukkan nomor referensi (contoh: PEA-20261120-1234)"
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
              className="w-full pl-10 pr-24 py-3 rounded-full border border-pink-200 text-xs sm:text-sm font-nunito bg-white shadow-sm focus:outline-none focus:border-brand-pink"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-colors"
            >
              Cari
            </button>
          </div>
        </form>

        {/* Local Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-pink-100 text-center shadow-sm">
            <ShoppingBag className="w-12 h-12 text-pink-300 mx-auto mb-3" />
            <h3 className="font-fredoka text-lg text-brand-dark-blue mb-1">
              Belum Ada Riwayat Pesanan
            </h3>
            <p className="text-gray-500 font-nunito text-xs sm:text-sm mb-5">
              Pesanan yang Anda buat di browser ini akan otomatis tersimpan di sini.
            </p>
            <Link
              href="/katalog"
              className="px-6 py-2.5 rounded-full bg-brand-pink text-white font-nunito font-bold text-xs inline-block shadow-pink-sm"
            >
              Mulai Pesan Es Krim
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-gray-400 font-nunito uppercase tracking-wider pl-1">
              Riwayat Pesanan di Perangkat Ini ({orders.length})
            </span>
            {orders.map((o) => (
              <Link
                key={o.ref}
                href={`/pesanan/${o.ref}`}
                className="bg-white rounded-2xl p-4 border border-pink-100 shadow-sm hover:shadow-pink-sm transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-xs text-brand-pink">{o.ref}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold font-nunito">
                      {ORDER_STATUS_LABELS[o.orderStatus as keyof typeof ORDER_STATUS_LABELS] || "Menunggu Konfirmasi"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-nunito">
                    {o.items?.length || 1} menu • Rp {Number(o.subtotal || 0).toLocaleString("id-ID")}
                  </p>
                  <span className="text-[10px] text-gray-400 font-nunito">
                    {new Date(o.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-pink-50 group-hover:bg-brand-pink group-hover:text-white text-brand-pink flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
