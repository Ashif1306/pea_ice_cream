import type { Metadata, Viewport } from "next";
// Recompiled styles
import "./globals.css";
import { CartProvider } from "@/lib/contexts/cart-context";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Footer } from "@/components/layout/footer";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"),
  title: {
    default: "Pea Ice Cream – Es Krim Artisan Premium",
    template: "%s | Pea Ice Cream",
  },
  description:
    "Es krim artisan premium dengan cita rasa lokal dan internasional. " +
    "Homemade ice cream Makassar — tersedia dalam berbagai ukuran, bisa mix rasa, pesan via WhatsApp.",
  keywords: [
    "es krim Makassar",
    "pea ice cream",
    "homemade ice cream",
    "es krim artisan",
    "es krim mix rasa",
    "jual es krim Makassar",
  ],
  authors: [{ name: "Pea Ice Cream" }],
  creator: "Pea Ice Cream",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Pea Ice Cream",
    title: "Pea Ice Cream – Es Krim Artisan Premium",
    description:
      "Homemade ice cream Makassar. Mix rasa, pesan mudah, dikirim dengan cinta 🍦",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Pea Ice Cream" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pea Ice Cream – Es Krim Artisan Premium",
    description:
      "Homemade ice cream Makassar. Mix rasa, pesan mudah, dikirim dengan cinta 🍦",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B9D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&family=Nunito:wght@300;400;500;600;700;800&display=swap"
        />
      </head>
      <body
        className="min-h-screen flex flex-col antialiased"
        style={{ fontFamily: '"Nunito", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        <CartProvider>
          {/* Sticky top header */}
          <Header />

          {/* Page content — grows to fill available space */}
          <main className="flex-1">
            {children}
          </main>

          {/* Desktop footer */}
          <Footer />

          {/* Mobile bottom navigation */}
          <BottomNav />
        </CartProvider>
      </body>
    </html>
  );
}
