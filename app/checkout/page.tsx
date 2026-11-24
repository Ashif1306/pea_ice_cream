"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/contexts/cart-context";
import { CUP_SIZE_LABELS } from "@/lib/constants";
import {
  ChevronLeft,
  Truck,
  Store,
  CreditCard,
  QrCode,
  AlertCircle,
  Copy,
  Check,
  MessageCircle,
  ShieldCheck,
  Info,
  MapPin,
  Clock,
} from "lucide-react";
import { DEFAULT_OUTLETS, OutletLocation } from "@/lib/outlets-data";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [addressLandmark, setAddressLandmark] = useState("");
  const [selectedOutletId, setSelectedOutletId] = useState("outlet-main-store");
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "qris">("qris");
  const [orderNotes, setOrderNotes] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // WhatsApp Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [createdOrderRef, setCreatedOrderRef] = useState("");
  const [generatedWaText, setGeneratedWaText] = useState("");
  const [waUrl, setWaUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [copied, setCopied] = useState(false);
  const [idempotencyKey] = useState(() => `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  // If cart is empty and not showing modal
  if (items.length === 0 && !previewModalOpen && !createdOrderRef) {
    return (
      <div className="container-brand py-16 text-center max-w-md mx-auto">
        <h1 className="font-fredoka text-2xl text-brand-dark-blue mb-2">
          Keranjang Masih Kosong
        </h1>
        <p className="text-gray-500 font-nunito text-sm mb-6">
          Silakan pilih menu es krim terlebih dahulu sebelum melakukan checkout.
        </p>
        <Link
          href="/katalog"
          className="px-6 py-2.5 rounded-full bg-brand-pink text-white font-nunito font-bold text-sm inline-block"
        >
          Lihat Katalog
        </Link>
      </div>
    );
  }

  const validateForm = () => {
    const errs: { [key: string]: string } = {};
    if (!customerName.trim()) {
      errs.customerName = "Nama lengkap wajib diisi";
    }
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 9) {
      errs.customerPhone = "Nomor WhatsApp aktif wajib diisi (minimal 9 digit)";
    }
    if (deliveryMethod === "delivery") {
      if (!deliveryAddress.trim()) {
        errs.deliveryAddress = "Alamat pengiriman wajib diisi untuk layanan antar";
      }
      if (!addressLandmark.trim()) {
        errs.addressLandmark = "Patokan / petunjuk arah wajib diisi agar kurir mudah menemukan";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError("");

    const currentOutlet = DEFAULT_OUTLETS.find((o) => o.id === selectedOutletId) || DEFAULT_OUTLETS[0];
    const finalDeliveryAddress =
      deliveryMethod === "pickup"
        ? `Ambil Sendiri di ${currentOutlet.name} (${currentOutlet.detailLocation ? currentOutlet.detailLocation + ", " : ""}${currentOutlet.address})`
        : deliveryAddress.trim();
    const finalLandmark =
      deliveryMethod === "pickup"
        ? `Jam Buka: ${currentOutlet.hours}`
        : addressLandmark.trim();

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          deliveryMethod,
          deliveryAddress: finalDeliveryAddress,
          addressLandmark: finalLandmark,
          paymentMethod,
          orderNotes: orderNotes.trim(),
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            hasFlavorSelection: i.hasFlavorSelection,
            flavorChoiceLabel: i.flavorChoiceLabel,
            flavorChoices: i.flavorChoices,
            flavorCombo: i.flavorCombo,
            size: i.size,
            quantity: i.quantity,
            price: i.price,
            notes: i.notes,
          })),
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat pesanan.");
      }

      setCreatedOrderRef(data.ref);
      setGeneratedWaText(data.waMessage);
      setWaUrl(data.waUrl);
      setPreviewModalOpen(true);
      clearCart();
    } catch (err: any) {
      setServerError(err.message || "Terjadi kesalahan saat memproses pesanan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedWaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateOpenWa = () => {
    if (waUrl) {
      window.open(waUrl, "_blank");
    } else {
      const fallbackUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(generatedWaText)}`;
      window.open(fallbackUrl, "_blank");
    }
  };

  const handleFinishToSummary = () => {
    router.push(`/pesanan/${createdOrderRef}`);
  };

  return (
    <div className="bg-pink-50/40 min-h-screen py-6 sm:py-10 pb-32 md:pb-16">
      <div className="container-brand max-w-2xl">
        {/* Navigation */}
        <div className="mb-4">
          <Link
            href="/keranjang"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500 hover:text-brand-pink font-nunito"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali ke Keranjang</span>
          </Link>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue">
            Checkout Pesanan
          </h1>
          <p className="text-gray-500 font-nunito text-xs sm:text-sm">
            Tanpa perlu login. Lengkapi formulir di bawah untuk konfirmasi pesanan es krimmu.
          </p>
        </div>

        <form onSubmit={handleSubmitOrder} className="flex flex-col gap-6">
          {/* ─── 1. Data Pemesan ─────────────────────────────────────── */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-pink-100 shadow-sm">
            <h2 className="font-fredoka text-lg text-brand-dark-blue mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-pink-100 text-brand-pink text-xs flex items-center justify-center font-bold">1</span>
              <span>Data Pelanggan</span>
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-dark-blue font-nunito mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Nurul Hidayah"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-nunito focus:outline-none ${
                    errors.customerName ? "border-red-400 bg-red-50/50" : "border-gray-200 focus:border-brand-pink"
                  }`}
                />
                {errors.customerName && (
                  <span className="text-red-500 text-[11px] font-nunito mt-1 block">
                    {errors.customerName}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-dark-blue font-nunito mb-1">
                  Nomor WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-nunito focus:outline-none ${
                    errors.customerPhone ? "border-red-400 bg-red-50/50" : "border-gray-200 focus:border-brand-pink"
                  }`}
                />
                {errors.customerPhone && (
                  <span className="text-red-500 text-[11px] font-nunito mt-1 block">
                    {errors.customerPhone}
                  </span>
                )}
                <span className="text-gray-400 text-[11px] font-nunito mt-1 block">
                  Admin akan mengirimkan rincian ongkir & konfirmasi ke nomor ini.
                </span>
              </div>
            </div>
          </div>

          {/* ─── 2. Metode Pengiriman ─────────────────────────────────── */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-pink-100 shadow-sm">
            <h2 className="font-fredoka text-lg text-brand-dark-blue mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-pink-100 text-brand-pink text-xs flex items-center justify-center font-bold">2</span>
              <span>Metode Pengiriman</span>
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setDeliveryMethod("delivery")}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  deliveryMethod === "delivery"
                    ? "border-brand-pink bg-pink-50/70 shadow-pink-sm"
                    : "border-gray-200 hover:border-pink-200"
                }`}
              >
                <Truck className={`w-5 h-5 mb-2 ${deliveryMethod === "delivery" ? "text-brand-pink" : "text-gray-400"}`} />
                <div>
                  <span className={`block font-fredoka text-sm ${deliveryMethod === "delivery" ? "text-brand-pink" : "text-brand-dark-blue"}`}>
                    Antar ke Alamat
                  </span>
                  <span className="text-[10px] text-gray-500 font-nunito">
                    Ongkir dikonfirmasi admin
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod("pickup")}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  deliveryMethod === "pickup"
                    ? "border-brand-pink bg-pink-50/70 shadow-pink-sm"
                    : "border-gray-200 hover:border-pink-200"
                }`}
              >
                <Store className={`w-5 h-5 mb-2 ${deliveryMethod === "pickup" ? "text-brand-pink" : "text-gray-400"}`} />
                <div>
                  <span className={`block font-fredoka text-sm ${deliveryMethod === "pickup" ? "text-brand-pink" : "text-brand-dark-blue"}`}>
                    Ambil Sendiri
                  </span>
                  <span className="text-[10px] text-emerald-600 font-nunito font-semibold">
                    Bebas Ongkir (Outlet)
                  </span>
                </div>
              </button>
            </div>

            {deliveryMethod === "delivery" ? (
              <div className="flex flex-col gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-brand-dark-blue font-nunito mb-1">
                    Alamat Lengkap di Makassar <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Jl. Pettarani No. 12, Kel. Sinrijala, Kec. Panakkukang"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-nunito focus:outline-none ${
                      errors.deliveryAddress ? "border-red-400 bg-red-50/50" : "border-gray-200 focus:border-brand-pink"
                    }`}
                  />
                  {errors.deliveryAddress && (
                    <span className="text-red-500 text-[11px] font-nunito mt-1 block">
                      {errors.deliveryAddress}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-dark-blue font-nunito mb-1">
                    Patokan / Ciri Rumah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pagar hitam depan Indomaret, dekat masjid"
                    value={addressLandmark}
                    onChange={(e) => setAddressLandmark(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-nunito focus:outline-none ${
                      errors.addressLandmark ? "border-red-400 bg-red-50/50" : "border-gray-200 focus:border-brand-pink"
                    }`}
                  />
                  {errors.addressLandmark && (
                    <span className="text-red-500 text-[11px] font-nunito mt-1 block">
                      {errors.addressLandmark}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-pink-50 rounded-xl text-[11px] text-brand-dark-blue font-nunito flex items-start gap-2">
                  <Info className="w-4 h-4 text-brand-pink flex-shrink-0 mt-0.5" />
                  <span>
                    Ongkir antar tidak Rp0. Besaran ongkir akan dihitung admin sesuai jarak dari outlet kami di Makassar dan diberitahukan via WhatsApp.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-brand-dark-blue font-nunito flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-brand-pink" />
                    <span>Pilih Lokasi Outlet untuk Pengambilan:</span>
                  </label>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Bebas Ongkir
                  </span>
                </div>

                <div className="space-y-2">
                  {DEFAULT_OUTLETS.map((outlet) => {
                    const isSelected = selectedOutletId === outlet.id;
                    const isMain = outlet.type === "main";

                    return (
                      <button
                        key={outlet.id}
                        type="button"
                        onClick={() => setSelectedOutletId(outlet.id)}
                        className={`w-full p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                          isSelected
                            ? "bg-pink-50/80 border-brand-pink ring-2 ring-brand-pink/30 shadow-xs"
                            : "bg-white hover:bg-slate-50 border-gray-200"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isSelected
                              ? "border-brand-pink bg-brand-pink text-white"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-fredoka text-sm font-bold text-brand-dark-blue">
                              {outlet.name}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.2 rounded-full ${
                                isMain
                                  ? "bg-brand-pink text-white"
                                  : "bg-pink-100 text-brand-pink"
                              }`}
                            >
                              {isMain ? "Main Store" : "Outlet Mall"}
                            </span>
                          </div>

                          {outlet.detailLocation && (
                            <p className="text-xs text-brand-pink font-semibold font-nunito">
                              {outlet.detailLocation}
                            </p>
                          )}

                          <p className="text-[11px] text-slate-500 font-nunito mt-0.5">
                            {outlet.address}
                          </p>

                          <div className="flex items-center gap-1 text-[11px] text-amber-700 mt-1 font-nunito">
                            <Clock className="w-3 h-3 text-amber-600 flex-shrink-0" />
                            <span>{outlet.hours}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl text-[11px] text-emerald-900 font-nunito flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Pesanan Anda akan disiapkan di outlet yang Anda pilih di atas. Estimasi siap ambil akan dikonfirmasikan oleh admin via WhatsApp setelah pesanan dibuat.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ─── 3. Metode Pembayaran ─────────────────────────────────── */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-pink-100 shadow-sm">
            <h2 className="font-fredoka text-lg text-brand-dark-blue mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-pink-100 text-brand-pink text-xs flex items-center justify-center font-bold">3</span>
              <span>Metode Pembayaran</span>
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("qris")}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  paymentMethod === "qris"
                    ? "border-brand-pink bg-pink-50/70 shadow-pink-sm"
                    : "border-gray-200 hover:border-pink-200"
                }`}
              >
                <QrCode className={`w-5 h-5 mb-2 ${paymentMethod === "qris" ? "text-brand-pink" : "text-gray-400"}`} />
                <div>
                  <span className={`block font-fredoka text-sm ${paymentMethod === "qris" ? "text-brand-pink" : "text-brand-dark-blue"}`}>
                    QRIS
                  </span>
                  <span className="text-[10px] text-gray-500 font-nunito">
                    Gopay, OVO, Dana, BCA
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("transfer")}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  paymentMethod === "transfer"
                    ? "border-brand-pink bg-pink-50/70 shadow-pink-sm"
                    : "border-gray-200 hover:border-pink-200"
                }`}
              >
                <CreditCard className={`w-5 h-5 mb-2 ${paymentMethod === "transfer" ? "text-brand-pink" : "text-gray-400"}`} />
                <div>
                  <span className={`block font-fredoka text-sm ${paymentMethod === "transfer" ? "text-brand-pink" : "text-brand-dark-blue"}`}>
                    Transfer Bank
                  </span>
                  <span className="text-[10px] text-gray-500 font-nunito">
                    BCA / Mandiri / BNI
                  </span>
                </div>
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl text-[11px] text-gray-600 font-nunito flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-pink flex-shrink-0 mt-0.5" />
              <span>
                <strong>Verifikasi Manual Admin:</strong> Nomor rekening atau kode QRIS resmi akan dikirimkan oleh admin melalui WhatsApp bersamaan dengan total akhir (termasuk ongkir).
              </span>
            </div>
          </div>

          {/* ─── 4. Catatan Tambahan ──────────────────────────────────── */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-pink-100 shadow-sm">
            <h2 className="font-fredoka text-base text-brand-dark-blue mb-2">
              Catatan untuk Penjual (Opsional)
            </h2>
            <textarea
              rows={2}
              placeholder="Contoh: Pesanan untuk acara sore hari, tolong sediakan sendok es krim..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-nunito focus:outline-none focus:border-brand-pink"
            />
          </div>

          {/* ─── 5. Ringkasan & Submit ────────────────────────────────── */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-pink-100 shadow-sm">
            <h2 className="font-fredoka text-lg text-brand-dark-blue mb-3">
              Ringkasan Pesanan
            </h2>

            <div className="flex flex-col gap-2.5 mb-4 pb-4 border-b border-pink-50">
              {items.map((i, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs font-nunito text-gray-600 gap-2">
                  <div>
                    <span className="font-semibold text-brand-dark-blue">
                      {i.quantity}x {i.name}
                    </span>
                    {i.hasFlavorSelection && i.flavorChoices && i.flavorChoices.length > 0 ? (
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        <span className="text-gray-400">Pilihan rasa: </span>
                        <span className="font-semibold text-brand-dark-blue">
                          {i.flavorChoices
                            .map(
                              (c) =>
                                `${c.flavorName}${
                                  c.extraPrice > 0 ? ` (+Rp ${c.extraPrice.toLocaleString("id-ID")})` : ""
                                }`
                            )
                            .join(", ")}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Ukuran: {CUP_SIZE_LABELS[i.size]} • {i.flavorCombo.join(" + ")}
                      </div>
                    )}
                    {i.notes && (
                      <div className="text-[10px] text-gray-400 italic">Catatan: &quot;{i.notes}&quot;</div>
                    )}
                  </div>
                  <span className="font-semibold text-brand-dark-blue flex-shrink-0">
                    Rp {(i.price * i.quantity).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center py-1.5 text-sm font-nunito">
              <span className="text-gray-500">Subtotal Produk</span>
              <span className="font-fredoka font-bold text-brand-dark-blue">
                Rp {totalPrice.toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 text-xs font-nunito">
              <span className="text-gray-500">Biaya Ongkir</span>
              <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                {deliveryMethod === "delivery" ? "Dikonfirmasi Admin" : "Rp 0 (Ambil Sendiri)"}
              </span>
            </div>

            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-2xl text-xs font-nunito flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <p className="text-[11px] text-gray-400 font-nunito mt-3 mb-6">
              *Dengan menekan tombol di bawah, pesanan akan tersimpan di sistem database kami dan Anda akan melihat pratinjau pesan WhatsApp untuk konfirmasi ke admin.
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-full bg-gradient-to-r from-brand-pink to-brand-pink-light text-white font-nunito font-bold text-base shadow-pink-md hover:shadow-pink-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{isSubmitting ? "Memproses Pesanan ke Database..." : "Buat Pesanan & Pratinjau WhatsApp"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ─── WhatsApp Message Preview Modal (Business Rule) ──────── */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-pink-100 max-h-[90vh] flex flex-col">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center mx-auto mb-2">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="font-fredoka text-xl text-brand-dark-blue">
                Pratinjau Pesan WhatsApp
              </h3>
              <p className="text-xs text-gray-500 font-nunito">
                No. Referensi: <strong className="text-brand-pink font-fredoka">{createdOrderRef}</strong>
              </p>
            </div>

            {/* Disclaimer Alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-amber-900 text-xs font-nunito mb-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Catatan Penting:</strong>
                <p className="mt-0.5">
                  Membuka WhatsApp bukan bukti pesan sudah dikirim. Pesanan sudah tersimpan di sistem kami dengan status <strong>Menunggu Konfirmasi</strong>.
                </p>
              </div>
            </div>

            {/* Message Box */}
            <div className="flex-1 overflow-y-auto bg-gray-50 rounded-2xl p-4 border border-gray-200 font-mono text-xs text-gray-700 whitespace-pre-wrap leading-relaxed mb-4 select-all">
              {generatedWaText}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="py-2.5 px-4 rounded-full border border-gray-300 text-xs font-bold font-nunito text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Tersalin!" : "Salin Pesan"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateOpenWa}
                  className="py-2.5 px-4 rounded-full bg-[#25D366] text-white text-xs font-bold font-nunito hover:bg-[#20b857] flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Buka WhatsApp</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleFinishToSummary}
                className="w-full py-3 rounded-full bg-brand-pink text-white font-nunito font-bold text-sm shadow-pink-sm hover:bg-brand-pink-dark transition-colors"
              >
                Lihat Ringkasan & Status Pesanan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
