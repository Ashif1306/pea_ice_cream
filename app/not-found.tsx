import Link from "next/link";
import Image from "next/image";
import { IceCreamDecoration } from "@/components/ui/ice-cream-decoration";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-brand py-20 min-h-[70vh] flex flex-col items-center justify-center text-center">
      <div className="relative w-24 h-24 mb-6">
        <IceCreamDecoration variant="cone" size={96} animationClass="animate-bounce-soft" />
      </div>
      <span className="font-fredoka text-6xl text-brand-pink mb-2">404</span>
      <h1 className="font-fredoka text-2xl sm:text-3xl text-brand-dark-blue mb-2">
        Halaman Meleleh!
      </h1>
      <p className="text-gray-500 font-nunito text-sm sm:text-base max-w-md mb-8">
        Halaman yang Anda cari tidak ditemukan atau sudah dipindahkan. Yuk kembali nikmati es krim kami!
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-pink text-white font-nunito font-bold text-sm shadow-pink-md hover:bg-brand-pink-dark transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Beranda</span>
      </Link>
    </div>
  );
}
