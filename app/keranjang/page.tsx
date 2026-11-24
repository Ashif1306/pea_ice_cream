"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart, itemKey } from "@/lib/contexts/cart-context";
import { CUP_SIZE_LABELS } from "@/lib/constants";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Info,
  ChevronLeft,
  Sparkles,
  Edit2,
  HelpCircle,
} from "lucide-react";

export default function KeranjangPage() {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-brand py-16 text-center max-w-md mx-auto pb-32 font-nunito">
        <div className="w-20 h-20 rounded-full bg-pink-100 text-brand-pink flex items-center justify-center mx-auto mb-4 animate-bounce-soft">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue mb-2">
          Keranjang Belanja Kosong
        </h1>
        <p className="text-gray-500 font-nunito text-sm mb-6">
          Wah, kamu belum memilih es krim favoritmu. Yuk jelajahi menu homemade kami!
        </p>
        <Link
          href="/katalog"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-pink text-white font-nunito font-bold text-sm shadow-pink-md hover:bg-brand-pink-dark transition-all"
        >
          <span>Mulai Belanja</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-pink-50/30 min-h-screen py-6 sm:py-10 pb-40 md:pb-24 font-nunito">
      <div className="container-brand max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/katalog"
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-brand-pink font-nunito mb-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Tambah Menu Lain</span>
            </Link>
            <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue">
              Keranjang Belanja ({totalItems} item)
            </h1>
          </div>
        </div>

        {/* ─── Item List ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3.5 mb-6">
          {items.map((item) => {
            const itemSubtotal = item.price * item.quantity;
            const currentItemKey = itemKey(item);

            return (
              <div
                key={currentItemKey}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-pink-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-pink-50 flex-shrink-0 border border-pink-100">
                    <Image
                      src="/placeholder-ice-cream.jpg"
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-fredoka text-base sm:text-lg text-brand-dark-blue font-medium">
                        {item.name}
                      </h3>
                      {item.hasFlavorSelection && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-brand-pink">
                          {item.flavorChoices?.length || 1} {item.flavorChoiceLabel || "Scoop"}
                        </span>
                      )}
                    </div>

                    {/* Detailed Flavor Choices Breakdown */}
                    {item.hasFlavorSelection && item.flavorChoices && item.flavorChoices.length > 0 ? (
                      <div className="mt-1.5 space-y-1">
                        <div className="text-xs font-semibold text-brand-dark-blue">
                          <span className="text-gray-500 font-normal">Pilihan rasa: </span>
                          <span className="text-brand-pink font-bold">
                            {item.flavorChoices
                              .map((c) =>
                                c.flavorName +
                                (c.extraPrice > 0
                                  ? ` (+Rp ${c.extraPrice.toLocaleString("id-ID")})`
                                  : "")
                              )
                              .join(", ")}
                          </span>
                        </div>

                        {/* Edit Choices Link */}
                        <div className="pt-0.5">
                          <Link
                            href={`/katalog/${item.productId}?editKey=${encodeURIComponent(currentItemKey)}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-pink hover:underline"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Ubah Pilihan Rasa</span>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      /* Legacy display */
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="px-2 py-0.5 rounded-full bg-pink-100 text-brand-pink text-[10px] font-bold font-nunito">
                          {CUP_SIZE_LABELS[item.size]}
                        </span>
                        <span className="text-xs text-gray-600 font-nunito font-semibold">
                          Rasa: {item.flavorCombo.join(" + ")}
                        </span>
                      </div>
                    )}

                    {item.notes && (
                      <p className="text-[11px] text-gray-400 font-nunito italic mt-1">
                        &quot;{item.notes}&quot;
                      </p>
                    )}

                    <div className="text-xs font-nunito text-gray-500 mt-1">
                      Rp {item.price.toLocaleString("id-ID")} / item
                    </div>
                  </div>
                </div>

                {/* Quantity Controls & Subtotal */}
                <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-pink-50">
                  <div className="flex items-center gap-2 bg-pink-50/80 p-1 rounded-full border border-pink-200">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item, item.quantity - 1)}
                      className="w-7 h-7 rounded-full bg-white text-brand-dark-blue flex items-center justify-center font-bold text-xs shadow-sm hover:bg-pink-100 transition-colors"
                      aria-label="Kurangi"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-fredoka text-sm min-w-[20px] text-center text-brand-dark-blue">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="w-7 h-7 rounded-full bg-white text-brand-dark-blue flex items-center justify-center font-bold text-xs shadow-sm disabled:opacity-40 hover:bg-pink-100 transition-colors"
                      aria-label="Tambah"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right min-w-[95px]">
                    <span className="font-fredoka text-base sm:text-lg text-brand-pink font-bold block">
                      Rp {itemSubtotal.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    title="Hapus dari keranjang"
                    aria-label={`Hapus ${item.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Informational Guidance Box (Requirement 6) ──────────── */}
        <div className="bg-pink-50/80 border border-pink-200/80 rounded-2xl p-4 flex items-start gap-3 text-brand-dark-blue text-xs font-nunito mb-6 shadow-xs">
          <HelpCircle className="w-5 h-5 text-brand-pink flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="block font-semibold text-brand-dark-blue">
              Petunjuk Kombinasi Rasa:
            </strong>
            <p className="text-gray-600 leading-relaxed">
              Jumlah produk di atas berlaku untuk item dengan pilihan rasa yang sama. Jika Anda menginginkan produk yang sama dengan kombinasi rasa yang berbeda, silakan tambahkan sebagai menu baru dari katalog.
            </p>
          </div>
        </div>

        {/* Delivery & Shipping Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900 text-xs sm:text-sm font-nunito mb-6">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold mb-0.5">Catatan Pengiriman & Ongkir:</strong>
            Subtotal di bawah belum termasuk biaya ongkir. Ongkir pengantaran akan dikonfirmasi manual oleh admin setelah pesanan dibuat, atau pilih opsi ambil sendiri di outlet Makassar untuk bebas ongkir.
          </div>
        </div>

        {/* ─── Summary Card ─────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-pink-100 shadow-sm">
          <h2 className="font-fredoka text-lg text-brand-dark-blue mb-3">
            Ringkasan Belanja
          </h2>
          <div className="flex items-center justify-between py-2 text-sm font-nunito border-b border-pink-50">
            <span className="text-gray-500">Total Item</span>
            <span className="font-semibold text-brand-dark-blue">{totalItems} cup</span>
          </div>
          <div className="flex items-center justify-between py-2 text-sm font-nunito border-b border-pink-50">
            <span className="text-gray-500">Subtotal Produk</span>
            <span className="font-fredoka font-bold text-base text-brand-dark-blue">
              Rp {totalPrice.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 text-xs font-nunito text-gray-400">
            <span>Biaya Ongkir</span>
            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              Dikonfirmasi Admin
            </span>
          </div>
        </div>
      </div>

      {/* ─── Sticky Bottom Checkout Bar ────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-pink-100 shadow-[0_-4px_20px_rgba(255,107,157,0.12)] p-4">
        <div className="container-brand max-w-3xl flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] text-gray-500 block font-nunito">
              Subtotal (belum ongkir)
            </span>
            <span className="font-fredoka text-xl sm:text-2xl text-brand-pink font-bold">
              Rp {totalPrice.toLocaleString("id-ID")}
            </span>
          </div>

          <Link
            href="/checkout"
            className="px-6 sm:px-8 py-3.5 rounded-full bg-gradient-to-r from-brand-pink to-brand-pink-light text-white font-nunito font-bold text-sm sm:text-base shadow-pink-md hover:shadow-pink-lg active:scale-95 transition-all flex items-center gap-2"
          >
            <span>Lanjut ke Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
