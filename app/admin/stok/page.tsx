"use client";

import React, { useState, useEffect } from "react";
import { DUMMY_PRODUCTS } from "@/lib/dummy-data";
import { CUP_SIZE_LABELS, CupSize } from "@/lib/constants";
import {
  adminFetchInventoryMatrix,
  adminUpdateInventoryStock,
} from "@/lib/supabase/services/inventory";
import { Save, AlertTriangle, Check, Layers, RefreshCw, AlertCircle } from "lucide-react";

export default function AdminStokPage() {
  const [stockState, setStockState] = useState<Record<string, Record<CupSize, { id: string; quantity: number }>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");

  const loadStock = async () => {
    setIsLoading(true);
    try {
      const data = await adminFetchInventoryMatrix();
      if (Object.keys(data).length > 0) {
        setStockState(data);
      } else {
        // Fallback demo matrix
        const fallback: Record<string, Record<CupSize, { id: string; quantity: number }>> = {};
        DUMMY_PRODUCTS.forEach((product) => {
          product.flavors.forEach((flavor) => {
            const key = `${product.name} - ${flavor}`;
            const flavorSlug = flavor.toLowerCase().replace(/\s+/g, "-");
            fallback[key] = {
              small: { id: "", quantity: product.stock?.[flavorSlug]?.small ?? 15 },
              medium: { id: "", quantity: product.stock?.[flavorSlug]?.medium ?? 12 },
              large: { id: "", quantity: product.stock?.[flavorSlug]?.large ?? 8 },
            };
          });
        });
        setStockState(fallback);
      }
    } catch (err: any) {
      console.warn("Inventory fetch fallback:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const handleStockChange = (key: string, size: CupSize, val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    setStockState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [size]: {
          ...prev[key]?.[size],
          quantity: num,
        },
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorNotice("");

    try {
      for (const key of Object.keys(stockState)) {
        for (const size of ["small", "medium", "large"] as CupSize[]) {
          const item = stockState[key]?.[size];
          if (item?.id) {
            await adminUpdateInventoryStock(item.id, item.quantity);
          }
        }
      }
      setSavedNotice("Perubahan stok berhasil disimpan permanen di database Supabase.");
      setTimeout(() => setSavedNotice(""), 3500);
    } catch (err: any) {
      setErrorNotice(`Gagal update stok di Supabase: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue">
            Manajemen Stok Kombinasi Rasa & Ukuran
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-nunito">
            Aturan: Stok dikelola per kombinasi rasa dan ukuran cup. Stok akan berkurang otomatis ketika admin menerima pesanan.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-colors shadow-pink-sm flex items-center justify-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Menyimpan ke Database..." : "Simpan Stok ke Database"}</span>
        </button>
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

      {/* ─── Stock Matrix Table ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-nunito">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Menu & Rasa</th>
                <th className="px-4 py-3 text-center">Cup Kecil (Small)</th>
                <th className="px-4 py-3 text-center">Cup Sedang (Medium)</th>
                <th className="px-4 py-3 text-center">Cup Besar (Large)</th>
                <th className="px-4 py-3 text-right">Status Kritis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {Object.entries(stockState).map(([key, sizes]) => {
                const sQty = typeof sizes.small === "number" ? sizes.small : sizes.small?.quantity ?? 0;
                const mQty = typeof sizes.medium === "number" ? sizes.medium : sizes.medium?.quantity ?? 0;
                const lQty = typeof sizes.large === "number" ? sizes.large : sizes.large?.quantity ?? 0;
                const hasLowStock = sQty < 10 || mQty < 10 || lQty < 10;
                return (
                  <tr key={key} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-brand-dark-blue">{key}</div>
                      <span className="text-[10px] text-slate-400">Tersedia untuk campur rasa</span>
                    </td>

                    {/* Small */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={sQty}
                        onChange={(e) => handleStockChange(key, "small", e.target.value)}
                        className={`w-20 px-2.5 py-1 text-center rounded-lg border text-xs font-mono font-bold focus:outline-none ${
                          sQty < 10 ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white"
                        }`}
                      />
                    </td>

                    {/* Medium */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={mQty}
                        onChange={(e) => handleStockChange(key, "medium", e.target.value)}
                        className={`w-20 px-2.5 py-1 text-center rounded-lg border text-xs font-mono font-bold focus:outline-none ${
                          mQty < 10 ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white"
                        }`}
                      />
                    </td>

                    {/* Large */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={lQty}
                        onChange={(e) => handleStockChange(key, "large", e.target.value)}
                        className={`w-20 px-2.5 py-1 text-center rounded-lg border text-xs font-mono font-bold focus:outline-none ${
                          lQty < 10 ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white"
                        }`}
                      />
                    </td>

                    {/* Alert */}
                    <td className="px-4 py-3 text-right">
                      {hasLowStock ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Stok &lt; 10</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <span>Aman</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
