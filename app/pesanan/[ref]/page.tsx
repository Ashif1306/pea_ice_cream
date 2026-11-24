"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  QrCode,
  Store,
  Truck,
  MessageCircle,
  Copy,
  Check,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  Info,
} from "lucide-react";
import { CUP_SIZE_LABELS } from "@/lib/constants";

export default function OrderSummaryPage() {
  const params = useParams();
  const orderRef = params?.ref as string;

  const [order, setOrder] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [privacyError, setPrivacyError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      setIsLoading(true);
      setPrivacyError("");

      try {
        const res = await fetch(`/api/orders/${orderRef}`);
        const data = await res.json();

        if (res.status === 403) {
          setPrivacyError(data.error || "Akses ditolak: Anda tidak memiliki otorisasi untuk melihat detail pesanan ini.");
          return;
        }

        if (res.ok && data.order) {
          const o = data.order;
          setOrder({
            ref: o.ref,
            customerName: o.customer_name,
            customerPhone: o.customer_phone,
            deliveryMethod: o.delivery_method,
            deliveryAddress: o.delivery_address,
            addressLandmark: o.address_landmark,
            paymentMethod: o.payment_method,
            orderNotes: o.order_notes,
            items: (o.items || []).map((i: any) => ({
              productId: i.product_id,
              name: i.product_name_snapshot,
              flavorCombo: i.flavor_snapshot || [],
              flavorChoices: i.flavor_choices || [],
              size: i.size,
              quantity: i.quantity,
              price: i.unit_price,
            })),
            subtotal: o.subtotal,
            deliveryFeeStatus: o.delivery_method === "delivery"
              ? (o.delivery_fee !== null ? `Rp ${o.delivery_fee.toLocaleString("id-ID")}` : "Dikonfirmasi Admin")
              : "Bebas Ongkir",
            orderStatus: o.order_status,
            paymentStatus: o.payment_status,
            createdAt: o.created_at,
          });
          return;
        }
      } catch (err) {
        console.warn("API order fetch error, falling back:", err);
      }

      // Fallback local storage
      try {
        const storedOrders = JSON.parse(localStorage.getItem("pea_orders") || "[]");
        const found = storedOrders.find((o: any) => o.ref === orderRef);
        if (found) {
          setOrder(found);
        } else {
          setOrder({
            ref: orderRef || "PEA-DEMO-001",
            customerName: "Pelanggan Pea",
            customerPhone: "08123456789",
            deliveryMethod: "delivery",
            deliveryAddress: "Jl. Boulevard Makassar, Panakkukang",
            addressLandmark: "Samping ruko merah",
            paymentMethod: "qris",
            orderNotes: "Tolong sendok es krim disiapkan",
            items: [
              {
                productId: "prod-001",
                name: "Vanilla Dream",
                flavorCombo: ["Vanilla", "Stroberi"],
                size: "medium",
                quantity: 2,
                price: 20000,
              },
            ],
            subtotal: 40000,
            deliveryFeeStatus: "Dikonfirmasi Admin",
            orderStatus: "pending",
            paymentStatus: "unpaid",
            createdAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }

    if (orderRef) {
      loadOrder();
    }
  }, [orderRef]);

  const copyRef = () => {
    if (order?.ref) {
      navigator.clipboard.writeText(order.ref);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (privacyError) {
    return (
      <div className="container-brand py-16 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="font-fredoka text-2xl text-brand-dark-blue mb-2">
          Akses Pesanan Dilindungi
        </h1>
        <p className="text-gray-500 font-nunito text-xs sm:text-sm mb-6 leading-relaxed">
          {privacyError}
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-full bg-brand-pink text-white font-nunito font-bold text-xs inline-block shadow-pink-sm"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  if (isLoading || !order) {
    return (
      <div className="container-brand py-16 text-center">
        <p className="text-gray-500 font-nunito">Memuat data pesanan...</p>
      </div>
    );
  }

  const isDelivery = order.deliveryMethod === "delivery";

  return (
    <div className="bg-pink-50/40 min-h-screen py-6 sm:py-10 pb-32 md:pb-16">
      <div className="container-brand max-w-2xl">
        {/* Success Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-sm text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue mb-1">
            Pesanan Berhasil Dibuat!
          </h1>
          <p className="text-gray-500 font-nunito text-xs sm:text-sm mb-4">
            Terima kasih telah memesan Pea Ice Cream Makassar. Pesanan Anda telah tersimpan di sistem.
          </p>

          {/* Reference Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-50 rounded-2xl border border-pink-200">
            <span className="text-xs text-gray-500 font-nunito">No. Referensi:</span>
            <span className="font-mono font-bold text-sm text-brand-pink">{order.ref}</span>
            <button
              onClick={copyRef}
              className="p-1 hover:text-brand-pink transition-colors text-gray-400"
              title="Salin No. Referensi"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Status Badge */}
          <div className="mt-4 flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold font-nunito shadow-sm">
              <Clock className="w-3.5 h-3.5" />
              <span>Status: Menunggu Konfirmasi Admin</span>
            </span>
          </div>
        </div>

        {/* Business Rule Flow Notice */}
        <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm mb-6">
          <h2 className="font-fredoka text-base text-brand-dark-blue mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-brand-pink" />
            <span>Apa yang Terjadi Selanjutnya?</span>
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm font-nunito text-gray-600">
            <li>
              <strong>Konfirmasi Admin:</strong> Admin kami akan memeriksa ketersediaan stok rasa dan ukuran yang Anda pilih.
            </li>
            <li>
              <strong>Ongkir & Pembayaran:</strong> Jika Anda memilih pengiriman antar, admin akan mengonfirmasi biaya ongkir dan mengirimkan nomor rekening / kode QRIS via WhatsApp.
            </li>
            <li>
              <strong>Pengurangan Stok:</strong> Stok produk akan resmi dikurangi setelah admin menerima dan mengonfirmasi pesanan Anda.
            </li>
          </ol>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm mb-6">
          <h2 className="font-fredoka text-lg text-brand-dark-blue mb-4">
            Rincian Pesanan
          </h2>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-3 pb-4 mb-4 border-b border-pink-50 text-xs font-nunito">
            <div>
              <span className="text-gray-400 block">Nama Pemesan</span>
              <span className="font-semibold text-brand-dark-blue">{order.customerName}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Nomor WhatsApp</span>
              <span className="font-semibold text-brand-dark-blue">{order.customerPhone}</span>
            </div>
          </div>

          {/* Delivery & Payment Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 mb-4 border-b border-pink-50 text-xs font-nunito">
            <div className="flex items-start gap-2">
              {isDelivery ? <Truck className="w-4 h-4 text-brand-pink mt-0.5" /> : <Store className="w-4 h-4 text-emerald-600 mt-0.5" />}
              <div>
                <span className="text-gray-400 block font-semibold">
                  {isDelivery ? "Pengiriman Antar" : "Ambil Sendiri di Outlet"}
                </span>
                <span className="text-gray-700">{order.deliveryAddress}</span>
                {order.addressLandmark && order.addressLandmark !== "-" && (
                  <span className="text-gray-500 block italic">Patokan: {order.addressLandmark}</span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              {order.paymentMethod === "qris" ? <QrCode className="w-4 h-4 text-brand-pink mt-0.5" /> : <CreditCard className="w-4 h-4 text-brand-pink mt-0.5" />}
              <div>
                <span className="text-gray-400 block font-semibold">Metode Pembayaran</span>
                <span className="text-gray-700">
                  {order.paymentMethod === "qris" ? "QRIS (Verifikasi Manual)" : "Transfer Bank (Verifikasi Manual)"}
                </span>
              </div>
            </div>
          </div>

          {/* Ordered Items */}
          <div className="flex flex-col gap-2.5 mb-4 pb-4 border-b border-pink-50">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start text-xs sm:text-sm font-nunito">
                <div>
                  <span className="font-semibold text-brand-dark-blue">{item.quantity}x {item.name}</span>
                  {item.flavorChoices && item.flavorChoices.length > 0 ? (
                    <div className="text-[11px] text-gray-600 mt-0.5">
                      <span className="text-gray-400">Pilihan rasa: </span>
                      <span className="font-semibold text-brand-dark-blue">
                        {item.flavorChoices
                          .map((fc: any) =>
                            `${fc.flavorName || fc.name || "Rasa"}${
                              fc.extraPrice > 0 ? ` (+Rp ${Number(fc.extraPrice).toLocaleString("id-ID")})` : ""
                            }`
                          )
                          .join(", ")}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500 block text-[11px]">
                      {(CUP_SIZE_LABELS as any)[item.size] || item.size} • Rasa: {Array.isArray(item.flavorCombo) ? item.flavorCombo.join(" + ") : item.flavorCombo}
                    </span>
                  )}
                  {item.notes && (
                    <span className="text-gray-400 block text-[10px] italic mt-0.5">Catatan: {item.notes}</span>
                  )}
                </div>
                <span className="font-fredoka font-semibold text-brand-dark-blue">
                  Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          <div className="flex justify-between items-center py-1 text-sm font-nunito">
            <span className="text-gray-500">Subtotal Produk</span>
            <span className="font-fredoka font-bold text-brand-dark-blue">
              Rp {Number(order.subtotal || 0).toLocaleString("id-ID")}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 text-xs font-nunito">
            <span className="text-gray-500">Ongkir</span>
            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              {order.deliveryFeeStatus || (isDelivery ? "Dikonfirmasi Admin" : "Rp 0")}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/katalog"
            className="flex-1 py-3.5 px-6 rounded-full bg-brand-pink text-white font-nunito font-bold text-sm text-center shadow-pink-md hover:bg-brand-pink-dark transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Pesan Es Krim Lagi</span>
          </Link>
          <Link
            href="/"
            className="py-3.5 px-6 rounded-full bg-white border border-pink-200 text-brand-dark-blue font-nunito font-semibold text-sm text-center hover:bg-pink-50 transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
