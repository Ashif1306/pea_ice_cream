import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Clock } from "lucide-react";

export default function TentangPage() {
  return (
    <div className="bg-pink-50/30 min-h-screen py-10 sm:py-16 pb-32 md:pb-20">
      <div className="container-brand max-w-3xl">
        <div className="text-center mb-10">
          <div
            className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-pink-100 shadow-pink-sm"
            style={{ width: "96px", height: "96px" }}
          >
            <Image
              src="/logo.jpg"
              alt="Logo Pea Ice Cream Makassar"
              width={96}
              height={96}
              className="w-full h-full object-cover"
              style={{ width: "96px", height: "96px", objectFit: "cover" }}
            />
          </div>
          <h1 className="font-fredoka text-3xl sm:text-4xl text-brand-dark-blue mb-2">
            Tentang Pea Ice Cream
          </h1>
          <p className="text-gray-500 font-nunito text-sm sm:text-base">
            Es Krim Homemade Pilihan Warga Makassar
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-pink-100 shadow-sm flex flex-col gap-6 text-gray-700 font-nunito leading-relaxed text-sm sm:text-base mb-8">
          <p>
            Selamat datang di <strong>Pea Ice Cream</strong>! Kami adalah produsen es krim artisan lokal yang berbasis di Kota Makassar, Sulawesi Selatan. Dengan resep homemade klasik dan bahan-bahan pilihan, kami menghadirkan sajian es krim bertekstur lembut, manis pas, dan menyegarkan.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
            <div className="p-4 rounded-2xl bg-pink-50 text-center">
              <span className="font-fredoka text-xl text-brand-pink block mb-1">Klasik & Modern</span>
              <span className="text-xs text-gray-600">Perpaduan cita rasa legendaris dan kreasi kekinian</span>
            </div>
            <div className="p-4 rounded-2xl bg-yellow-50 text-center">
              <span className="font-fredoka text-xl text-yellow-800 block mb-1">Mix 2 Rasa</span>
              <span className="text-xs text-gray-600">Bebas kombinasikan rasa dalam satu cup</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 text-center">
              <span className="font-fredoka text-xl text-emerald-800 block mb-1">Cinta Makassar</span>
              <span className="text-xs text-gray-600">Dibuat fresh setiap hari dengan standar mutu tinggi</span>
            </div>
          </div>

          <p>
            Mulai dari Vanilla Dream, Chocolate Fudge, Strawberry Delight, hingga cita rasa khas seperti Durian Sultan dan Pandan Wangi, kami selalu memastikan setiap scoop memberikan senyuman.
          </p>

          <div className="pt-4 border-t border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin className="w-4 h-4 text-brand-pink" />
              <span>Makassar, Sulawesi Selatan</span>
            </div>
            <Link
              href="/katalog"
              className="px-6 py-2.5 rounded-full bg-brand-pink text-white font-bold text-xs shadow-pink-sm hover:bg-brand-pink-dark transition-colors"
            >
              Lihat Menu Es Krim
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
