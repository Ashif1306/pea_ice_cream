"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { DUMMY_PRODUCTS, Product } from "@/lib/dummy-data";
import { fetchCatalogProducts } from "@/lib/supabase/services/products";
import { fetchCategories, ProductCategoryItem } from "@/lib/supabase/services/categories";
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS, ProductCategory } from "@/lib/constants";
import { Search, SlidersHorizontal, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";

export default function KatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFlavor, setSelectedFlavor] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "name">("featured");

  useEffect(() => {
    fetchCatalogProducts()
      .then((prods) => {
        setProducts(prods || []);
      })
      .catch((err) => console.warn("Katalog fetch fallback:", err));

    fetchCategories(true)
      .then((cats) => {
        if (cats && cats.length > 0) {
          setCategories(cats);
        }
      })
      .catch((err) => console.warn("Categories fetch fallback:", err));
  }, []);

  // Extract all available distinct flavors across all products (exclude duplicate product names)
  const allFlavors = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      p.flavors.forEach((f) => {
        if (f && f.trim().toLowerCase() !== p.name.trim().toLowerCase()) {
          set.add(f);
        }
      });
      (p.allowedFlavors || []).forEach((af) => {
        if (af.flavorName && af.flavorName.trim().toLowerCase() !== p.name.trim().toLowerCase()) {
          set.add(af.flavorName);
        }
      });
    });
    return Array.from(set);
  }, [products]);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category match
      if (selectedCategory !== "all") {
        const matchesSlug = product.category === selectedCategory;
        const matchesId = product.categoryId === selectedCategory;
        if (!matchesSlug && !matchesId) {
          return false;
        }
      }
      // Flavor match
      if (selectedFlavor !== "all" && !product.flavors.includes(selectedFlavor)) {
        return false;
      }
      // Search match
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        const matchesFlavor = product.flavors.some((f) => f.toLowerCase().includes(query));
        if (!matchesName && !matchesDesc && !matchesFlavor) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "price-asc") return a.basePrice - b.basePrice;
      if (sortBy === "price-desc") return b.basePrice - a.basePrice;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0);
    });
  }, [products, searchQuery, selectedCategory, selectedFlavor, sortBy]);

  return (
    <div className="container-brand py-6 sm:py-10 pb-28 md:pb-16">
      {/* Header */}
      <div className="mb-6 text-center sm:text-left">
        <h1 className="font-fredoka text-3xl sm:text-4xl text-brand-dark-blue mb-2">
          Katalog Es Krim Pea
        </h1>
        <p className="text-gray-500 font-nunito text-sm sm:text-base">
          Pilih rasa klasik favoritmu, tentukan ukuran cup, dan nikmati sensasi homemade Makassar!
        </p>
      </div>

      {/* ─── Search & Sort Bar ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari rasa (vanilla, cokelat, mangga, durian...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-pink-200 focus:outline-none focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 text-sm font-nunito bg-white shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              Hapus
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-full border border-pink-200 text-xs sm:text-sm font-nunito text-brand-dark-blue bg-white focus:outline-none focus:border-brand-pink shadow-sm"
            aria-label="Urutkan menu"
          >
            <option value="featured">Paling Populer</option>
            <option value="price-asc">Harga: Terendah ke Tertinggi</option>
            <option value="price-desc">Harga: Tertinggi ke Terendah</option>
            <option value="name">Nama: A - Z</option>
          </select>
        </div>
      </div>

      {/* ─── Category Filter Pills ────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-3">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold font-nunito whitespace-nowrap transition-all ${
            selectedCategory === "all"
              ? "bg-brand-pink text-white shadow-pink-sm"
              : "bg-white text-gray-600 border border-pink-100 hover:bg-pink-50"
          }`}
        >
          Semua Kategori
        </button>
        {categories.length > 0
          ? categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold font-nunito whitespace-nowrap transition-all ${
                  selectedCategory === cat.slug || selectedCategory === cat.id
                    ? "bg-brand-pink text-white shadow-pink-sm"
                    : "bg-white text-gray-600 border border-pink-100 hover:bg-pink-50"
                }`}
              >
                {cat.name}
              </button>
            ))
          : PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold font-nunito whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-brand-pink text-white shadow-pink-sm"
                    : "bg-white text-gray-600 border border-pink-100 hover:bg-pink-50"
                }`}
              >
                {PRODUCT_CATEGORY_LABELS[cat]}
              </button>
            ))}
      </div>

      {/* ─── Flavor Pills Filter (Only if distinct flavors exist) ─── */}
      {allFlavors.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-4 scrollbar-none mb-6">
          <span className="text-[11px] font-semibold text-gray-400 font-nunito uppercase tracking-wider pl-1 mr-1">
            Rasa:
          </span>
          <button
            onClick={() => setSelectedFlavor("all")}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold font-nunito whitespace-nowrap transition-colors ${
              selectedFlavor === "all"
                ? "bg-brand-dark-blue text-white"
                : "bg-pink-50 text-gray-600 hover:bg-pink-100"
            }`}
          >
            Semua Rasa
          </button>
          {allFlavors.map((flavor) => (
            <button
              key={flavor}
              onClick={() => setSelectedFlavor(flavor)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold font-nunito whitespace-nowrap transition-colors ${
                selectedFlavor === flavor
                  ? "bg-brand-dark-blue text-white"
                  : "bg-pink-50 text-gray-600 hover:bg-pink-100"
              }`}
            >
              {flavor}
            </button>
          ))}
        </div>
      )}

      {/* ─── Product Grid ─────────────────────────────────────────── */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-pink-100 p-8 sm:p-12 text-center max-w-md mx-auto my-8">
          <AlertCircle className="w-12 h-12 text-brand-pink mx-auto mb-3" />
          <h3 className="font-fredoka text-xl text-brand-dark-blue mb-1">
            Menu Tidak Ditemukan
          </h3>
          <p className="text-gray-500 font-nunito text-xs sm:text-sm mb-5">
            Coba gunakan kata kunci lain atau reset filter untuk melihat semua pilihan rasa es krim.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setSelectedFlavor("all");
            }}
            className="px-6 py-2.5 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito shadow-pink-sm hover:bg-brand-pink-dark transition-colors"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {filteredProducts.map((product) => {
            const hasStock = product.isAvailable;
            const minPrice = product.basePrice || 15000;
            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border border-pink-100 shadow-sm hover:shadow-xl hover:shadow-pink-500/15 hover:border-brand-pink/50 hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer ${
                  !hasStock ? "opacity-75" : ""
                }`}
              >
                {/* Photo with Sheen Reflection Effect */}
                <div className="relative aspect-square w-full bg-pink-50/60 overflow-hidden">
                  <Image
                    src={product.images[0] || "/placeholder-ice-cream.jpg"}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                  />
                  {/* Subtle Light Sheen Sweep on Hover */}
                  <div
                    className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
                    aria-hidden="true"
                  />
                  {product.isBestseller && (
                    <span className="absolute top-2 left-2 bg-gradient-to-r from-brand-pink to-brand-pink-light text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm group-hover:scale-105 transition-transform duration-300">
                      Bestseller
                    </span>
                  )}
                  {!hasStock && (
                    <div className="absolute inset-0 bg-brand-dark-blue/50 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-red-500 text-white font-fredoka text-xs sm:text-sm px-3 py-1 rounded-full shadow-md">
                        Stok Habis
                      </span>
                    </div>
                  )}
                </div>

                {/* Details (Identical clean layout to home page) */}
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-fredoka text-base sm:text-lg text-brand-dark-blue group-hover:text-brand-pink transition-colors duration-200 line-clamp-1 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-gray-500 font-nunito text-xs line-clamp-2 mb-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-pink-50 flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-nunito">Mulai</span>
                      <span className="font-fredoka text-sm sm:text-base text-brand-pink font-semibold group-hover:font-bold transition-all">
                        Rp {minPrice.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <Link
                      href={`/katalog/${product.id}`}
                      className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold font-nunito transition-all duration-300 flex items-center gap-1 active:scale-95 ${
                        hasStock
                          ? "bg-pink-100 group-hover:bg-brand-pink text-brand-pink group-hover:text-white shadow-none group-hover:shadow-md group-hover:shadow-brand-pink/25"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
                      }`}
                    >
                      <span>Pilih</span>
                      {hasStock && (
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hidden sm:inline-block" />
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
