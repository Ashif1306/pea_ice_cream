"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Truck,
  Store,
  ChevronRight,
  ClipboardList,
  Clock,
  CheckCircle,
} from "lucide-react";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { adminFetchOrders } from "@/lib/supabase/services/orders";

export default function AdminPesananPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      setIsLoading(true);
      try {
        const data = await adminFetchOrders();
        if (data.length > 0) {
          setOrders(data);
          return;
        }
      } catch (err: any) {
        console.warn("Orders fetch fallback:", err.message);
      }

      // Fallback to local storage or demo orders
      try {
        const stored = JSON.parse(localStorage.getItem("pea_orders") || "[]");
        if (stored.length > 0) {
          setOrders(stored);
        } else {
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
      } finally {
        setIsLoading(false);
      }
    }

    loadOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== "all" && o.orderStatus !== orderStatusFilter) return false;
    if (paymentStatusFilter !== "all" && o.paymentStatus !== paymentStatusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchRef = o.ref.toLowerCase().includes(q);
      const matchName = o.customerName.toLowerCase().includes(q);
      const matchPhone = o.customerPhone.toLowerCase().includes(q);
      if (!matchRef && !matchName && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue">
          Daftar Pesanan Pelanggan
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm font-nunito">
          Kelola pesanan masuk, konfirmasi ongkir pengiriman, dan verifikasi pembayaran pelanggan.
        </p>
      </div>

      {/* ─── Filters Bar (Separated Order & Payment Statuses) ─────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor ref, nama, atau nomor WA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
          />
        </div>

        {/* Filter Status Pesanan */}
        <select
          value={orderStatusFilter}
          onChange={(e) => setOrderStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-nunito text-slate-700 focus:outline-none focus:border-brand-pink bg-white"
          aria-label="Filter status pesanan"
        >
          <option value="all">Semua Status Pesanan</option>
          <option value="pending">Menunggu Konfirmasi</option>
          <option value="confirmed">Dikonfirmasi Admin</option>
          <option value="preparing">Sedang Dipersiapkan</option>
          <option value="ready">Siap Diantar/Ambil</option>
          <option value="delivered">Selesai</option>
          <option value="cancelled">Dibatalkan</option>
        </select>

        {/* Filter Status Pembayaran Terpisah */}
        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-nunito text-slate-700 focus:outline-none focus:border-brand-pink bg-white"
          aria-label="Filter status pembayaran"
        >
          <option value="all">Semua Status Pembayaran</option>
          <option value="unpaid">Belum Dibayar</option>
          <option value="paid">Sudah Transfer / QRIS</option>
          <option value="verified">Terverifikasi Lunas</option>
        </select>
      </div>

      {/* ─── Orders Table ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs font-nunito">
            Tidak ada pesanan yang sesuai dengan filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-nunito">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">No. Referensi</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Pelanggan</th>
                  <th className="px-4 py-3">Metode Antar</th>
                  <th className="px-4 py-3">Total Menu</th>
                  <th className="px-4 py-3">Subtotal</th>
                  <th className="px-4 py-3">Status Pesanan</th>
                  <th className="px-4 py-3">Status Bayar</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.map((order) => {
                  const isDelivery = order.deliveryMethod === "delivery";
                  return (
                    <tr key={order.ref} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-brand-dark-blue">
                        {order.ref}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-[11px]">
                        {new Date(order.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-brand-dark-blue">{order.customerName}</div>
                        <div className="text-[10px] text-slate-400">{order.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1">
                          {isDelivery ? <Truck className="w-3.5 h-3.5 text-brand-pink" /> : <Store className="w-3.5 h-3.5 text-emerald-600" />}
                          <span>{isDelivery ? "Antar" : "Ambil"}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">{order.items?.length || 1} jenis</td>
                      <td className="px-4 py-3 font-fredoka font-semibold text-brand-dark-blue">
                        Rp {Number(order.subtotal || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.orderStatus === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : order.orderStatus === "confirmed"
                              ? "bg-blue-100 text-blue-800"
                              : order.orderStatus === "delivered"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {ORDER_STATUS_LABELS[order.orderStatus as keyof typeof ORDER_STATUS_LABELS] || order.orderStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.paymentStatus === "verified" || order.paymentStatus === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {order.paymentStatus === "verified"
                            ? "Terverifikasi"
                            : order.paymentStatus === "paid"
                            ? "Sudah Transfer"
                            : "Belum Bayar"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/pesanan/${order.ref}`}
                          className="px-3 py-1 rounded-full bg-brand-pink text-white text-[11px] font-bold hover:bg-brand-pink-dark transition-colors inline-block shadow-sm"
                        >
                          Rincian
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
    </div>
  );
}
