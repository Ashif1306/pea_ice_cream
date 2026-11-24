import Link from "next/link";
import Image from "next/image";
import { fetchCatalogProducts } from "@/lib/supabase/services/products";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { OutletsSection } from "@/components/home/outlets-section";
import { PartnerAppsSection } from "@/components/home/partner-apps-section";
import {
  Clock,
  MessageCircle,
  ShoppingBag,
  Heart,
  ChevronRight,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default async function HomePage() {
  const products = await fetchCatalogProducts();
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="flex flex-col overflow-x-hidden">
      {/* ─── Hero Carousel ───────────────────────────────────────────── */}
      <HeroCarousel />

      {/* ─── Menu Pilihan (Featured Products) ────────────────────────── */}
      <section className="container-brand py-12 sm:py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-brand-pink font-semibold font-nunito text-xs sm:text-sm uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-brand-pink" />
              <span>Favorit Pelanggan</span>
            </div>
            <h2 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue">
              Pilihan Menu Favorit
            </h2>
          </div>
          <Link
            href="/katalog"
            className="hidden sm:flex items-center gap-1 text-sm font-bold text-brand-pink hover:text-brand-dark-blue transition-colors font-nunito"
          >
            <span>Lihat Semua Menu</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Grid */}
        {featuredProducts.length === 0 ? (
          <div className="bg-pink-50/50 rounded-2xl border border-pink-100 p-8 text-center">
            <p className="text-slate-600 font-nunito text-sm mb-3">
              Menu es krim sedang disiapkan oleh admin.
            </p>
            <Link
              href="/katalog"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-pink text-white text-xs font-bold font-nunito hover:bg-brand-pink-dark transition-colors"
            >
              <span>Buka Halaman Katalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {featuredProducts.map((product) => {
              const minPrice = product.basePrice || 15000;
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-pink-100 shadow-sm hover:shadow-xl hover:shadow-pink-500/15 hover:border-brand-pink/50 hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer"
                >
                  {/* Photo with Sheen Reflection Effect */}
                  <div className="relative aspect-square w-full bg-pink-50/60 overflow-hidden">
                    <Image
                      src={product.images[0] || "/placeholder-ice-cream.jpg"}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
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
                  </div>

                  {/* Details */}
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
                        className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-pink-100 group-hover:bg-brand-pink text-brand-pink group-hover:text-white text-xs sm:text-sm font-bold font-nunito transition-all duration-300 shadow-none group-hover:shadow-md group-hover:shadow-brand-pink/25 flex items-center gap-1 active:scale-95"
                      >
                        <span>Pilih</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hidden sm:inline-block" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/katalog"
            className="inline-flex items-center justify-center gap-1.5 w-full py-3 rounded-full bg-white border border-pink-200 text-brand-pink font-bold font-nunito text-sm shadow-sm"
          >
            <span>Lihat Semua Menu</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─── Cerita Pea Section ──────────────────────────────────────── */}
      <section id="cerita-pea" className="bg-pink-50/70 py-12 sm:py-16 border-y border-pink-100 scroll-mt-24">
        <div className="container-brand">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
            <div className="relative aspect-square max-w-xs mx-auto w-full rounded-3xl overflow-hidden shadow-pink-md border-4 border-white bg-white">
              <img
                src="/banners/banner-classic.svg"
                alt="Tentang Pea Ice Cream Makassar"
                className="w-full h-full object-cover"
                style={{ display: "block" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-pink/20 to-transparent pointer-events-none" />
            </div>

            <div className="flex flex-col gap-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 text-brand-pink font-semibold font-nunito text-xs sm:text-sm justify-center md:justify-start">
                <Heart className="w-4 h-4 fill-brand-pink" />
                <span>Homemade Makassar</span>
              </div>
              <h2 className="font-fredoka text-2xl sm:text-4xl text-brand-dark-blue">
                Cerita Pea Ice Cream
              </h2>
              <p className="text-gray-600 font-nunito leading-relaxed text-sm sm:text-base">
                Berawal dari kecintaan terhadap es krim klasik buatan tangan, Pea Ice Cream hadir di Makassar untuk menyajikan rasa autentik yang manisnya pas dan teksturnya ramah di lidah.
              </p>
              <p className="text-gray-600 font-nunito leading-relaxed text-sm sm:text-base">
                Setiap scoop dibuat dengan teliti, menghadirkan kegembiraan sederhana untuk dinikmati bersama keluarga dan sahabat di cuaca hangat Makassar.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-white p-3 rounded-2xl border border-pink-100 shadow-sm text-center">
                  <span className="font-fredoka text-xl text-brand-pink block">100%</span>
                  <span className="text-xs text-gray-500 font-nunito">Homemade Love</span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-pink-100 shadow-sm text-center">
                  <span className="font-fredoka text-xl text-brand-pink block">Mix Rasa</span>
                  <span className="text-xs text-gray-500 font-nunito">Bebas Dikombinasi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pilihan Aplikasi Pemesanan (Dynamic Real-Time Partner Apps) ─── */}
      <PartnerAppsSection />

      {/* ─── Lokasi & Jam Operasional Multi-Outlet (Real-Time Status) ── */}
      <OutletsSection />

      {/* ─── Kontak & Bantuan ─────────────────────────────────────────── */}
      <section id="kontak" className="container-brand pb-24 md:pb-16 scroll-mt-24">
        <div className="bg-white rounded-2xl border border-pink-100 p-6 sm:p-8 text-center max-w-2xl mx-auto shadow-sm">
          <MessageCircle className="w-10 h-10 text-brand-pink mx-auto mb-3" />
          <h2 className="font-fredoka text-xl sm:text-2xl text-brand-dark-blue mb-2">
            Punya Pertanyaan atau Pesanan Khusus?
          </h2>
          <p className="text-gray-500 font-nunito text-xs sm:text-sm mb-6">
            Admin kami siap membantu konfirmasi pesanan partai, acara ulang tahun, maupun katering es krim di area Makassar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/katalog"
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-brand-pink text-white text-sm font-bold font-nunito hover:bg-brand-dark-blue transition-colors"
            >
              Lihat Menu & Pesan
            </Link>
            <Link
              href="/pesanan"
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-pink-50 text-brand-pink text-sm font-bold font-nunito hover:bg-pink-100 transition-colors"
            >
              Cek Status Pesanan
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
