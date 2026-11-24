"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { CupSize, CUP_SIZE_LABELS } from "@/lib/constants";
import { Product } from "@/lib/dummy-data";
import { fetchProductById } from "@/lib/supabase/services/products";
import { useCart, CartFlavorChoice } from "@/lib/contexts/cart-context";

export default function ProductDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = params?.id as string;
  const editCartKey = searchParams.get("editKey");

  const { items, addItem, updateItemChoices } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSize, setSelectedSize] = useState<CupSize>("small");
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  const [isSuccessModal, setIsSuccessModal] = useState<boolean>(false);

  // Single checklist of chosen flavor IDs
  const [checkedFlavorIds, setCheckedFlavorIds] = useState<string[]>([]);

  // Legacy single/mix flavor state (for standard products)
  const [legacyFlavor1, setLegacyFlavor1] = useState<string>("");

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const p = await fetchProductById(productId);
        if (p) {
          setProduct(p);
        }
      } catch (err) {
        console.error("Gagal memuat detail produk:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [productId]);

  const isMixEnabled = Boolean(product?.isMixEnabled ?? product?.hasFlavorSelection);
  const minFlavorCount = Math.max(1, product?.minFlavorCount || 1);
  const maxFlavorCount = Math.max(minFlavorCount, product?.maxFlavorCount || product?.flavorChoiceCount || 2);

  // Allowed flavors configured by admin for this product
  const allowedFlavors = useMemo(() => {
    if (!product?.allowedFlavors) return [];
    return product.allowedFlavors.filter((f) => f.isActive !== false);
  }, [product]);

  // Available (in-stock) flavors
  const availableFlavors = useMemo(() => {
    return allowedFlavors.filter((f) => f.isFlavorAvailable !== false);
  }, [allowedFlavors]);

  // Pre-fill when editing from cart
  useEffect(() => {
    if (!product || !editCartKey) return;
    const existingCartItem = items.find((i) => {
      // Find item matching editCartKey
      return (
        i.productId === product.id &&
        (i.flavorChoices?.length || 0) > 0
      );
    });

    if (existingCartItem && existingCartItem.flavorChoices) {
      setCheckedFlavorIds(existingCartItem.flavorChoices.map((fc) => fc.flavorId));
      setQuantity(existingCartItem.quantity);
      if (existingCartItem.notes) setNotes(existingCartItem.notes);
    }
  }, [product, editCartKey, items]);

  // Toggle flavor checkbox in single checklist
  const handleToggleFlavor = (flavorId: string) => {
    setCheckedFlavorIds((prev) => {
      if (prev.includes(flavorId)) {
        // Uncheck
        return prev.filter((id) => id !== flavorId);
      }
      if (prev.length >= maxFlavorCount) {
        // Max limit reached
        return prev;
      }
      // Check
      return [...prev, flavorId];
    });
  };

  // Validation: selection meets minimum
  const isSelectionValid = useMemo(() => {
    if (!isMixEnabled) return true;
    return checkedFlavorIds.length >= minFlavorCount && checkedFlavorIds.length <= maxFlavorCount;
  }, [isMixEnabled, checkedFlavorIds, minFlavorCount, maxFlavorCount]);

  // Calculate Unit Price: base price + extra price of checked flavors (if configured)
  const calculatedUnitPrice = useMemo(() => {
    if (!product) return 0;

    let unit = product.basePrice || 15000;

    if (isMixEnabled) {
      for (const fId of checkedFlavorIds) {
        const cfg = allowedFlavors.find((f) => f.flavorId === fId);
        if (cfg && cfg.extraPrice > 0) {
          unit += cfg.extraPrice;
        }
      }
      return unit;
    }

    const sizeConfig = product.sizes?.find((s) => s.size === selectedSize);
    return sizeConfig ? sizeConfig.price : product.basePrice || 15000;
  }, [product, isMixEnabled, checkedFlavorIds, allowedFlavors, selectedSize]);

  const stockAvailable = 30;

  const handleAddToCart = () => {
    if (!product) return;
    if (isMixEnabled && !isSelectionValid) return;

    if (isMixEnabled) {
      // Build structured CartFlavorChoice list sorted by flavorName / flavorId
      const choices: CartFlavorChoice[] = checkedFlavorIds
        .map((fId, idx) => {
          const cfg = allowedFlavors.find((f) => f.flavorId === fId);
          return {
            choiceIndex: idx + 1,
            choiceLabel: "Pilihan",
            flavorId: fId,
            flavorName: cfg?.flavorName || "Rasa",
            extraPrice: cfg?.extraPrice || 0,
          };
        })
        .sort((a, b) => a.flavorName.localeCompare(b.flavorName));

      const comboNames = choices.map((c) => c.flavorName);

      const cartItemPayload = {
        productId: product.id,
        name: product.name,
        hasFlavorSelection: true,
        flavorChoices: choices,
        flavorChoiceLabel: "Pilihan rasa",
        flavorCombo: comboNames,
        size: "small" as CupSize,
        quantity,
        basePrice: product.basePrice,
        price: calculatedUnitPrice,
        notes: notes.trim() || undefined,
        maxStock: stockAvailable,
      };

      if (editCartKey) {
        updateItemChoices(editCartKey, cartItemPayload);
        router.push("/keranjang");
        return;
      }

      addItem(cartItemPayload);
    } else {
      // Standard product without mix
      const standardItemPayload = {
        productId: product.id,
        name: product.name,
        hasFlavorSelection: false,
        flavorCombo: [legacyFlavor1 || product.name],
        size: selectedSize,
        quantity,
        price: calculatedUnitPrice,
        notes: notes.trim() || undefined,
        maxStock: stockAvailable,
      };

      if (editCartKey) {
        updateItemChoices(editCartKey, standardItemPayload);
        router.push("/keranjang");
        return;
      }

      addItem(standardItemPayload);
    }

    setIsSuccessModal(true);
  };

  if (isLoading && !product) {
    return (
      <div className="container-brand py-24 text-center">
        <div className="w-10 h-10 border-4 border-brand-pink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-nunito text-sm">Memuat detail menu es krim...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-brand py-16 text-center">
        <AlertCircle className="w-12 h-12 text-brand-pink mx-auto mb-3" />
        <h2 className="font-fredoka text-2xl text-brand-dark-blue mb-2">
          Produk Tidak Ditemukan
        </h2>
        <p className="text-gray-500 font-nunito text-sm mb-6">
          Menu yang Anda cari mungkin sudah tidak tersedia atau link salah.
        </p>
        <Link
          href="/katalog"
          className="px-6 py-2.5 rounded-full bg-brand-pink text-white font-nunito text-sm font-bold inline-block"
        >
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-pink-50/40 min-h-screen py-4 sm:py-8 pb-32 md:pb-16 font-nunito">
      <div className="container-brand max-w-4xl">
        {/* Back navigation */}
        <div className="mb-4">
          <Link
            href="/katalog"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500 hover:text-brand-pink font-nunito transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali ke Katalog</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-pink-100 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* ─── Left Column: Product Image & Badges ────────────────── */}
          <div className="relative aspect-square md:aspect-auto w-full bg-pink-50/60 p-4 sm:p-6 flex items-center justify-center">
            <div className="relative w-full h-full min-h-[280px] sm:min-h-[380px] rounded-2xl overflow-hidden shadow-sm">
              <Image
                src={product.images[0] || "/placeholder-ice-cream.jpg"}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
              {product.isBestseller && (
                <span className="absolute top-3 left-3 bg-gradient-to-r from-brand-pink to-brand-pink-light text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  Favorit Makassar
                </span>
              )}

              {isMixEnabled && (
                <span className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm text-brand-dark-blue text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-pink-100">
                  <Sparkles className="w-3.5 h-3.5 text-brand-pink" />
                  <span>
                    Bisa Mix {minFlavorCount === maxFlavorCount ? `${maxFlavorCount}` : `${minFlavorCount}–${maxFlavorCount}`} Rasa
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* ─── Right Column: Product Detail & Selection Form ──────── */}
          <div className="p-5 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Product Header */}
              <div className="mb-4">
                <span className="text-[11px] font-bold text-brand-pink uppercase tracking-wider font-nunito">
                  {product.categoryName || product.category}
                </span>
                <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue mt-0.5 mb-1.5 leading-tight">
                  {product.name}
                </h1>
                <p className="text-gray-600 font-nunito text-xs sm:text-sm leading-relaxed mb-3">
                  {product.description}
                </p>

                {/* Allergen Info */}
                {product.allergens && product.allergens.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-nunito bg-gray-50 px-2.5 py-1 rounded-lg w-fit">
                    <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>Alergen: {product.allergens.join(", ")}</span>
                  </div>
                )}
              </div>

              {/* ─── Pilihan Mix Rasa: SATU DAFTAR CHECKBOX RASA ─────── */}
              {isMixEnabled ? (
                <div className="space-y-3 pt-3 border-t border-pink-50 mb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-fredoka text-base text-brand-dark-blue">
                        Pilih rasa
                      </h3>
                      <p className="text-xs text-gray-500 font-nunito">
                        Pilih {minFlavorCount === maxFlavorCount ? `${maxFlavorCount}` : `${minFlavorCount}–${maxFlavorCount}`} rasa ·{" "}
                        <strong className="text-brand-pink">{checkedFlavorIds.length}/{maxFlavorCount}</strong> dipilih
                      </p>
                    </div>

                    {isSelectionValid && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        Pilihan lengkap
                      </span>
                    )}
                  </div>

                  {availableFlavors.length < minFlavorCount && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2 text-xs font-nunito text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Varian Rasa Belum Memadai:</strong>
                        <p className="mt-0.5">
                          Saat ini pilihan rasa yang tersedia tidak mencukupi untuk memenuhi minimal {minFlavorCount} rasa.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Single Checklist of Checkboxes */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {allowedFlavors.map((flavor) => {
                      const isChecked = checkedFlavorIds.includes(flavor.flavorId);
                      const isOutOfStock = flavor.isFlavorAvailable === false;
                      const isMaxReached = checkedFlavorIds.length >= maxFlavorCount;
                      const isDisabled = isOutOfStock || (!isChecked && isMaxReached);

                      return (
                        <label
                          key={flavor.flavorId}
                          onClick={() => {
                            if (!isDisabled || isChecked) {
                              handleToggleFlavor(flavor.flavorId);
                            }
                          }}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none text-xs sm:text-sm font-nunito ${
                            isChecked
                              ? "border-brand-pink bg-pink-50/80 text-brand-dark-blue shadow-xs font-semibold"
                              : isOutOfStock
                              ? "border-slate-100 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed"
                              : isMaxReached
                              ? "border-slate-100 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed"
                              : "border-pink-100 hover:border-pink-200 hover:bg-pink-50/30 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isDisabled && !isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 accent-brand-pink rounded cursor-pointer"
                            />
                            <span className={isChecked ? "text-brand-pink font-bold" : ""}>
                              {flavor.flavorName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {flavor.extraPrice > 0 && (
                              <span className="text-[11px] text-amber-700 font-mono font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                +Rp {flavor.extraPrice.toLocaleString("id-ID")}
                              </span>
                            )}
                            {isOutOfStock && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                Habis
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Quantity Selector */}
              <div className="pt-3 border-t border-pink-50 mb-5">
                <label className="text-xs font-bold text-brand-dark-blue font-nunito block mb-2">
                  Jumlah Pesanan
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-pink-50/80 p-1.5 rounded-full border border-pink-200">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-8 h-8 rounded-full bg-white text-brand-dark-blue flex items-center justify-center font-bold text-sm shadow-sm hover:bg-pink-100 disabled:opacity-40 transition-colors"
                      aria-label="Kurangi jumlah"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-fredoka text-base min-w-[28px] text-center text-brand-dark-blue">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(stockAvailable, q + 1))}
                      disabled={quantity >= stockAvailable}
                      className="w-8 h-8 rounded-full bg-white text-brand-dark-blue flex items-center justify-center font-bold text-sm shadow-sm hover:bg-pink-100 disabled:opacity-40 transition-colors"
                      aria-label="Tambah jumlah"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-500 font-nunito">
                    (Jumlah produk yang dipesan)
                  </span>
                </div>
              </div>

              {/* Optional Notes */}
              <div className="mb-5">
                <label className="text-xs font-bold text-brand-dark-blue font-nunito block mb-1">
                  Catatan Khusus (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: sendok disiapkan, jangan terlalu manis..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-pink-100 text-xs font-nunito focus:outline-none focus:border-brand-pink bg-pink-50/20"
                />
              </div>
            </div>

            {/* Bottom Price & Add to Cart Action */}
            <div className="pt-4 border-t border-pink-100 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-gray-400 block font-nunito">Harga:</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-fredoka text-2xl font-bold text-brand-pink">
                      Rp {(calculatedUnitPrice * quantity).toLocaleString("id-ID")}
                    </span>
                    {quantity > 1 && (
                      <span className="text-xs text-gray-400 font-nunito">
                        (@ Rp {calculatedUnitPrice.toLocaleString("id-ID")})
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full">
                    Stok Tersedia
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isMixEnabled && !isSelectionValid}
                className={`w-full py-3.5 rounded-2xl font-nunito font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-pink transition-all ${
                  isMixEnabled && !isSelectionValid
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed shadow-none"
                    : "bg-brand-pink hover:bg-brand-pink-dark text-white active:scale-[0.98]"
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span>
                  {editCartKey
                    ? "Perbarui Pilihan di Keranjang"
                    : isMixEnabled && !isSelectionValid
                    ? `Pilih Minimal ${minFlavorCount} Rasa`
                    : "Tambah ke Keranjang"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {isSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-xl border border-pink-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="font-fredoka text-xl text-brand-dark-blue mb-1">
              Berhasil Ditambahkan!
            </h3>
            <p className="text-xs text-gray-500 font-nunito mb-6">
              <strong>{product.name}</strong> ({quantity}x) berhasil dimasukkan ke keranjang belanja Anda.
            </p>

            <div className="space-y-2">
              <Link
                href="/keranjang"
                className="w-full py-3 rounded-2xl bg-brand-pink text-white font-nunito font-bold text-sm hover:bg-brand-pink-dark transition-colors block text-center shadow-sm"
              >
                Lihat Keranjang Belanja
              </Link>
              <button
                type="button"
                onClick={() => setIsSuccessModal(false)}
                className="w-full py-2.5 rounded-2xl border border-pink-200 text-brand-dark-blue font-nunito font-bold text-sm hover:bg-pink-50 transition-colors"
              >
                Lanjut Belanja Menu Lain
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
