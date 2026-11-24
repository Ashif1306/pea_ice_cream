"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Truck,
  Store,
  CreditCard,
  QrCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  MessageCircle,
  ShieldCheck,
  Save,
} from "lucide-react";
import { CUP_SIZE_LABELS, ORDER_STATUS_LABELS } from "@/lib/constants";
import { adminFetchOrderByRef, adminExecuteOrderAction } from "@/lib/supabase/services/orders";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderRef = params?.ref as string;

  const [order, setOrder] = useState<any>(null);
  const [orderStatus, setOrderStatus] = useState<string>("pending");
  const [paymentStatus, setPaymentStatus] = useState<string>("unpaid");
  const [deliveryFeeInput, setDeliveryFeeInput] = useState<string>("15000");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [stockDeducted, setStockDeducted] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      try {
        const dbOrder = await adminFetchOrderByRef(orderRef);
        if (dbOrder) {
          setOrder(dbOrder);
          setOrderStatus(dbOrder.orderStatus || "pending");
          setPaymentStatus(dbOrder.paymentStatus || "unpaid");
          setStockDeducted(!!dbOrder.stockDeducted);
          if (dbOrder.deliveryFee) setDeliveryFeeInput(String(dbOrder.deliveryFee));
          return;
        }
      } catch (err: any) {
        console.warn("DB order fetch error:", err.message);
      }

      // Fallback demo order
      try {
        const stored = JSON.parse(localStorage.getItem("pea_orders") || "[]");
        const found = stored.find((o: any) => o.ref === orderRef);
        if (found) {
          setOrder(found);
          setOrderStatus(found.orderStatus || "pending");
          setPaymentStatus(found.paymentStatus || "unpaid");
          setStockDeducted(!!found.stockDeducted);
        } else {
          const fallback = {
            id: "demo-id",
            ref: orderRef,
            customerName: "Ayu Pratiwi",
            customerPhone: "081244556677",
            deliveryMethod: "delivery",
            deliveryAddress: "Jl. Hertasning No. 45, Rappocini, Makassar",
            addressLandmark: "Samping ruko merah dekat apotek",
            paymentMethod: "qris",
            orderNotes: "Mohon sendok es krim disiapkan",
            subtotal: 45000,
            deliveryFee: 15000,
            totalAmount: 60000,
            orderStatus: "pending",
            paymentStatus: "unpaid",
            stockDeducted: false,
            createdAt: new Date().toISOString(),
            items: [
              {
                name: "Vanilla Dream",
                size: "medium",
                flavorCombo: ["Vanilla", "Stroberi"],
                quantity: 2,
                price: 20000,
                notes: "Jangan terlalu manis",
              },
            ],
          };
          setOrder(fallback);
          setOrderStatus(fallback.orderStatus);
          setPaymentStatus(fallback.paymentStatus);
        }
      } catch (e) {
        console.error(e);
      }
    }

    loadOrder();
  }, [orderRef]);

  if (!order) {
    return (
      <div className="p-8 text-center text-slate-500 font-nunito">
        Memuat detail pesanan...
      </div>
    );
  }

  // Handle Order Status Update (Ensuring idempotent stock deduction)
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage("");
    setSaveMessage("");

    try {
      let action: "confirm" | "cancel" | "update" = "update";
      if (orderStatus === "confirmed" && !stockDeducted) {
        action = "confirm";
      } else if (orderStatus === "cancelled") {
        action = "cancel";
      }

      const parsedDeliveryFee = parseInt(deliveryFeeInput || "0", 10);

      // Call API server action
      if (order.id && order.id !== "demo-id") {
        const res = await adminExecuteOrderAction({
          orderId: order.id,
          action,
          orderStatus,
          paymentStatus,
          deliveryFee: order.deliveryMethod === "delivery" ? parsedDeliveryFee : 0,
          note: adminNotes || undefined,
        });

        if (action === "confirm") {
          setStockDeducted(true);
        } else if (action === "cancel") {
          setStockDeducted(false);
        }

        setSaveMessage(res.message || "Status pesanan & stok berhasil diperbarui di database.");
      } else {
        // Demo fallback
        let willDeductStock = stockDeducted;
        if (orderStatus === "confirmed" && !stockDeducted) {
          willDeductStock = true;
          setStockDeducted(true);
        }
        setSaveMessage("Perubahan status pesanan disimpan sementara.");
      }

      setOrder((prev: any) => ({
        ...prev,
        orderStatus,
        paymentStatus,
        deliveryFee: parseInt(deliveryFeeInput || "0"),
        adminNotes,
      }));
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memperbarui status pesanan.");
    } finally {
      setIsProcessing(false);
      setTimeout(() => setSaveMessage(""), 4000);
    }
  };

  // Generate WhatsApp Reply message to customer
  const deliveryCost = order.deliveryMethod === "delivery" ? parseInt(deliveryFeeInput || "0") : 0;
  const grandTotal = Number(order.subtotal || 0) + deliveryCost;

  const replyWaMessage = `Halo kak ${order.customerName}! 🍦\nTerima kasih telah memesan di Pea Ice Cream Makassar.\n\nPesanan Anda *(${order.ref})* sudah kami konfirmasi:\n• Subtotal Menu: Rp ${Number(order.subtotal || 0).toLocaleString("id-ID")}\n• Ongkir ${order.deliveryMethod === "delivery" ? `(Makassar): Rp ${deliveryCost.toLocaleString("id-ID")}` : "(Ambil Sendiri): Rp 0"}\n• *Total Pembayaran:* Rp ${grandTotal.toLocaleString("id-ID")}\n\nSilakan lakukan pembayaran via ${order.paymentMethod === "qris" ? "QRIS Pea Ice Cream (kode QR terlampir)" : "Transfer Bank BCA: 1234567890 a.n Pea Ice Cream"}.\n\nSetelah transfer, mohon kirimkan bukti pembayaran di sini ya kak. Terima kasih! 💕`;

  const copyReply = () => {
    navigator.clipboard.writeText(replyWaMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Navigation */}
      <div>
        <Link
          href="/admin/pesanan"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-pink font-nunito mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Pesanan</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue">
              Pesanan #{order.ref}
            </h1>
            <p className="text-slate-500 text-xs font-nunito">
              Dibuat pada: {new Date(order.createdAt).toLocaleString("id-ID")}
            </p>
          </div>

          {/* Stock Deduction Status Guard Badge */}
          <div className="flex items-center gap-2">
            {stockDeducted ? (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-nunito flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Stok Sudah Dikurangi</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold font-nunito">
                Stok Belum Dikurangi
              </span>
            )}
          </div>
        </div>
      </div>

      {saveMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold font-nunito flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left: Order Details & Customer Info (2 Cols) ────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Delivery Info */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-fredoka text-base text-brand-dark-blue">
              Informasi Pelanggan & Pengiriman
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs font-nunito">
              <div>
                <span className="text-slate-400 block font-semibold">Nama Pelanggan</span>
                <span className="font-bold text-slate-800 text-sm">{order.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Nomor WhatsApp</span>
                <a
                  href={`https://wa.me/${order.customerPhone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-brand-pink hover:underline text-sm inline-flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{order.customerPhone}</span>
                </a>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs font-nunito">
              <span className="text-slate-400 block font-semibold mb-1">Metode Pengiriman</span>
              <div className="flex items-start gap-2">
                {order.deliveryMethod === "delivery" ? (
                  <Truck className="w-4 h-4 text-brand-pink mt-0.5" />
                ) : (
                  <Store className="w-4 h-4 text-emerald-600 mt-0.5" />
                )}
                <div>
                  <strong className="text-slate-800 block">
                    {order.deliveryMethod === "delivery" ? "Antar ke Alamat (Makassar)" : "Ambil Sendiri di Outlet"}
                  </strong>
                  <span className="text-slate-600">{order.deliveryAddress}</span>
                  {order.addressLandmark && order.addressLandmark !== "-" && (
                    <span className="text-slate-500 block italic mt-0.5">
                      Patokan: {order.addressLandmark}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {order.orderNotes && order.orderNotes !== "-" && (
              <div className="pt-3 border-t border-slate-100 text-xs font-nunito bg-pink-50/50 p-3 rounded-xl">
                <span className="text-brand-pink font-bold block mb-0.5">Catatan Khusus Pelanggan:</span>
                <span className="text-slate-700 italic">&quot;{order.orderNotes}&quot;</span>
              </div>
            )}
          </div>

          {/* Ordered Items Table */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-fredoka text-base text-brand-dark-blue">
              Item Menu yang Dipesan
            </h2>

            <div className="divide-y divide-slate-100">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="py-3 flex items-start justify-between gap-4 text-xs font-nunito">
                  <div>
                    <h3 className="font-bold text-brand-dark-blue text-sm">{item.name}</h3>
                    {item.flavorChoices && item.flavorChoices.length > 0 ? (
                      <div className="mt-0.5 text-xs">
                        <span className="text-slate-400">Pilihan rasa: </span>
                        <strong className="text-brand-dark-blue">
                          {item.flavorChoices
                            .map((fc: any) =>
                              `${fc.flavorName || fc.name || "Rasa"}${
                                fc.extraPrice > 0 ? ` (+Rp ${Number(fc.extraPrice).toLocaleString("id-ID")})` : ""
                              }`
                            )
                            .join(", ")}
                        </strong>
                      </div>
                    ) : (
                      <div className="text-slate-500 mt-0.5">
                        Ukuran: <strong className="text-slate-700">{(CUP_SIZE_LABELS as any)[item.size] || item.size}</strong> • Rasa:{" "}
                        <strong className="text-slate-700">
                          {Array.isArray(item.flavorCombo) ? item.flavorCombo.join(" + ") : item.flavorCombo}
                        </strong>
                      </div>
                    )}
                    {item.notes && (
                      <span className="text-slate-400 italic block mt-0.5">
                        Catatan item: {item.notes}
                      </span>
                    )}
                    <span className="text-slate-400 block mt-0.5">
                      Rp {Number(item.price).toLocaleString("id-ID")} x {item.quantity} cup
                    </span>
                  </div>

                  <span className="font-fredoka text-sm font-bold text-brand-pink">
                    Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1 text-xs font-nunito">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal Produk</span>
                <span className="font-bold text-slate-800">
                  Rp {Number(order.subtotal || 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ongkir ({order.deliveryMethod === "delivery" ? "Antar" : "Ambil"})</span>
                <span className="font-bold text-amber-700">
                  {order.deliveryMethod === "delivery" ? `Rp ${deliveryCost.toLocaleString("id-ID")}` : "Rp 0"}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 text-sm">
                <span className="font-bold text-slate-800">Total Akhir</span>
                <span className="font-fredoka font-bold text-base text-brand-pink">
                  Rp {grandTotal.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {/* WhatsApp Admin Response Generator */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-fredoka text-base text-brand-dark-blue flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>Format Balasan WhatsApp ke Pelanggan</span>
              </h2>
              <button
                type="button"
                onClick={copyReply}
                className="px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Tersalin!" : "Salin Pesan"}</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-200">
              {replyWaMessage}
            </div>
          </div>
        </div>

        {/* ─── Right: Status Management Sidebar (1 Col) ────────────── */}
        <div className="space-y-6">
          <form onSubmit={handleUpdateStatus} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-fredoka text-base text-brand-dark-blue">
              Kelola Status Pesanan
            </h2>

            {/* Status Pesanan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                Status Pesanan
              </label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink bg-white"
              >
                <option value="pending">Menunggu Konfirmasi</option>
                <option value="confirmed">Dikonfirmasi (Kurangi Stok)</option>
                <option value="preparing">Sedang Dipersiapkan</option>
                <option value="ready">Siap Diantar / Diambil</option>
                <option value="delivered">Selesai (Sudah Diterima)</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>

            {/* Status Pembayaran Terpisah */}
            <div>
              <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                Status Pembayaran (Terpisah)
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink bg-white"
              >
                <option value="unpaid">Belum Dibayar</option>
                <option value="paid">Pelanggan Mengklaim Sudah Bayar</option>
                <option value="verified">Terverifikasi Lunas oleh Admin</option>
              </select>
            </div>

            {/* Input Ongkos Kirim (Jika Antar) */}
            {order.deliveryMethod === "delivery" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                  Biaya Ongkir Antar (Rp)
                </label>
                <input
                  type="number"
                  value={deliveryFeeInput}
                  onChange={(e) => setDeliveryFeeInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-brand-pink"
                />
                <span className="text-[10px] text-slate-400 font-nunito mt-0.5 block">
                  Dihitung sesuai jarak outlet ke alamat pemesan.
                </span>
              </div>
            )}

            {/* Admin Internal Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 font-nunito mb-1">
                Catatan Internal Admin
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Catatan kurir atau staf dapur..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-nunito focus:outline-none focus:border-brand-pink"
              />
            </div>

            {/* Business Rule Stock Guard Explanatory Note */}
            <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-900 font-nunito flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Aturan Pengurangan Stok:</strong>
                <p className="mt-0.5">
                  Ketika status diubah ke <em>Dikonfirmasi</em>, stok produk berkurang. Pengubahan status berikutnya tidak akan mengurangi stok berulang kali.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-all shadow-pink-sm flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Status Pesanan</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
