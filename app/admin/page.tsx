"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Product } from "@/lib/dummy-data";
import { adminFetchAllProducts } from "@/lib/supabase/services/products";
import {
  ClipboardList,
  Clock,
  Layers,
  Package,
  AlertTriangle,
  CheckCircle,
  Truck,
  Store,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    adminFetchAllProducts().then((p) => setProducts(p)).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("pea_orders") || "[]");
      if (stored.length > 0) {
        setOrders(stored);
      } else {
        // Sample orders for demo display
        const demoOrders = [
          {
            ref: "PEA-20261120-1042",
            customerName: "Ayu Pratiwi",
            customerPhone: "081244556677",
            deliveryMethod: "delivery",
            deliveryAddress: "Jl. Hertasning No. 45, Rappocini, Makassar",
            paymentMethod: "qris",
            subtotal: 45000,
            deliveryFeeStatus: "Dikonfirmasi Admin",
            orderStatus: "pending",
            paymentStatus: "unpaid",
            createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
            items: [{ name: "Vanilla Dream", quantity: 2, size: "medium" }],
          },
          {
            ref: "PEA-20261120-0918",
            customerName: "Fajar Maulana",
            customerPhone: "085299881122",
            deliveryMethod: "pickup",
            deliveryAddress: "Ambil Sendiri di Outlet Makassar",
            paymentMethod: "transfer",
            subtotal: 60000,
            deliveryFeeStatus: "Bebas Ongkir",
            orderStatus: "confirmed",
            paymentStatus: "paid",
            createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
            items: [{ name: "Chocolate Fudge", quantity: 3, size: "medium" }],
          },
        ];
        setOrders(demoOrders);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Compute operational metrics (NO FAKE REVENUE NUMBERS)
  const pendingOrders = orders.filter((o) => o.orderStatus === "pending").length;
  const preparingOrders = orders.filter((o) => o.orderStatus === "confirmed" || o.orderStatus === "preparing").length;
  const activeProducts = products.filter((p) => p.isAvailable).length;

  // Count low stock flavor-size combinations
  let lowStockCount = 0;
  products.forEach((p) => {
    Object.values(p.stock || {}).forEach((sizeStock) => {
      Object.values(sizeStock).forEach((qty) => {
        if (qty < 10) lowStockCount++;
      });
    });
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue">
            Ringkasan Operasional
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-nunito">
            Pantau arus pesanan masuk, kesiapan operasional outlet, dan status stok harian.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/pesanan"
            className="px-4 py-2 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-colors shadow-sm"
          >
            Lihat Semua Pesanan
          </Link>
        </div>
      </div>

      {/* ─── Operational Metric Cards (No Fake Sales Figures) ─────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pending Orders */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 font-nunito">Menunggu Konfirmasi</span>
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-fredoka text-2xl sm:text-3xl text-amber-700 font-bold block">
              {pendingOrders}
            </span>
            <span className="text-[11px] text-slate-400 font-nunito">Perlu dicek stok & ongkir</span>
          </div>
        </div>

        {/* Preparing Orders */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 font-nunito">Sedang Dipersiapkan</span>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-fredoka text-2xl sm:text-3xl text-blue-700 font-bold block">
              {preparingOrders}
            </span>
            <span className="text-[11px] text-slate-400 font-nunito">Siap scoop & kemas</span>
          </div>
        </div>

        {/* Active Products */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 font-nunito">Menu Aktif</span>
            <div className="w-8 h-8 rounded-full bg-pink-100 text-brand-pink flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue font-bold block">
              {activeProducts}
            </span>
            <span className="text-[11px] text-slate-400 font-nunito">Dari {products.length} total produk</span>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 font-nunito">Stok Kritis (&lt;10)</span>
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-fredoka text-2xl sm:text-3xl text-red-600 font-bold block">
              {lowStockCount}
            </span>
            <span className="text-[11px] text-slate-400 font-nunito">Kombinasi rasa & ukuran</span>
          </div>
        </div>
      </div>

      {/* ─── Recent Orders Section ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-fredoka text-base sm:text-lg text-brand-dark-blue">
              Pesanan Terkini
            </h2>
            <p className="text-xs text-slate-400 font-nunito">
              Daftar pesanan terbaru yang masuk dari pelanggan melalui website
            </p>
          </div>
          <Link
            href="/admin/pesanan"
            className="text-xs font-bold text-brand-pink hover:underline flex items-center gap-1 font-nunito"
          >
            <span>Semua Pesanan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-nunito">
            Belum ada pesanan masuk.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-nunito">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3">No. Referensi</th>
                  <th className="px-4 py-3">Pelanggan</th>
                  <th className="px-4 py-3">Pengiriman</th>
                  <th className="px-4 py-3">Subtotal</th>
                  <th className="px-4 py-3">Status Pesanan</th>
                  <th className="px-4 py-3">Status Pembayaran</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.slice(0, 5).map((order) => {
                  const isDelivery = order.deliveryMethod === "delivery";
                  return (
                    <tr key={order.ref} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-brand-dark-blue">
                        {order.ref}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-brand-dark-blue">{order.customerName}</div>
                        <div className="text-[10px] text-slate-400">{order.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1">
                          {isDelivery ? <Truck className="w-3.5 h-3.5 text-brand-pink" /> : <Store className="w-3.5 h-3.5 text-emerald-600" />}
                          <span>{isDelivery ? "Antar" : "Ambil Sendiri"}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        Rp {Number(order.subtotal || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.orderStatus === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : order.orderStatus === "confirmed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {ORDER_STATUS_LABELS[order.orderStatus as keyof typeof ORDER_STATUS_LABELS] || order.orderStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.paymentStatus === "paid" || order.paymentStatus === "verified"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {order.paymentStatus === "paid" || order.paymentStatus === "verified" ? "Lunas" : "Belum Dibayar"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/pesanan/${order.ref}`}
                          className="px-3 py-1 rounded-full bg-slate-100 hover:bg-brand-pink hover:text-white text-slate-700 text-[11px] font-bold transition-colors inline-block"
                        >
                          Kelola
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Quick Navigation Cards ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/stok"
          className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-brand-pink hover:shadow-pink-sm transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-brand-pink flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-fredoka text-sm text-brand-dark-blue">Matriks Stok</h3>
              <p className="text-[11px] text-slate-400 font-nunito">Ubah stok rasa & ukuran</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-brand-pink transition-colors" />
        </Link>

        <Link
          href="/admin/profil"
          className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-brand-pink hover:shadow-pink-sm transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-fredoka text-sm text-brand-dark-blue">Profil & Tagline</h3>
              <p className="text-[11px] text-slate-400 font-nunito">Ubah tagline & jam buka</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-brand-pink transition-colors" />
        </Link>

        <Link
          href="/admin/pengiriman"
          className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-brand-pink hover:shadow-pink-sm transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-fredoka text-sm text-brand-dark-blue">Area & Ongkir</h3>
              <p className="text-[11px] text-slate-400 font-nunito">Aturan tarif kirim Makassar</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-brand-pink transition-colors" />
        </Link>
      </div>
    </div>
  );
}
