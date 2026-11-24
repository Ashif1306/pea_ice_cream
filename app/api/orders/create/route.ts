import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateGuestToken } from "@/lib/supabase/guest-token";
import { CUP_SIZE_LABELS } from "@/lib/constants";
import fs from "fs";
import path from "path";

// Simple IP-based rate limiting (Max 5 order creations per minute per IP)
const ipRateLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limitData = ipRateLimits.get(ip);

  if (!limitData || now > limitData.resetTime) {
    ipRateLimits.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (limitData.count >= 5) {
    return false;
  }

  limitData.count += 1;
  return true;
}

const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json");

function saveFallbackOrder(order: any) {
  try {
    const dir = path.dirname(ORDERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let existing: any[] = [];
    if (fs.existsSync(ORDERS_FILE)) {
      try {
        const raw = fs.readFileSync(ORDERS_FILE, "utf-8");
        existing = JSON.parse(raw);
        if (!Array.isArray(existing)) existing = [];
      } catch {
        existing = [];
      }
    }
    existing.unshift(order);
    if (existing.length > 100) existing = existing.slice(0, 100);
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(existing, null, 2), "utf-8");
  } catch (e) {
    console.error("Gagal menyimpan fallback order:", e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan pemesanan. Silakan coba kembali dalam 1 menit." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      deliveryMethod,
      deliveryAddress,
      addressLandmark,
      paymentMethod,
      orderNotes,
      items,
      idempotencyKey,
    } = body;

    // 1. Basic validation
    if (!customerName || typeof customerName !== "string" || !customerName.trim()) {
      return NextResponse.json({ error: "Nama pelanggan wajib diisi." }, { status: 400 });
    }

    const cleanPhone = (customerPhone || "").replace(/\D/g, "");
    if (cleanPhone.length < 9) {
      return NextResponse.json(
        { error: "Nomor WhatsApp aktif wajib diisi (minimal 9 digit)." },
        { status: 400 }
      );
    }

    if (!["delivery", "pickup"].includes(deliveryMethod)) {
      return NextResponse.json({ error: "Metode pengiriman tidak valid." }, { status: 400 });
    }

    if (deliveryMethod === "delivery" && (!deliveryAddress || !deliveryAddress.trim())) {
      return NextResponse.json(
        { error: "Alamat pengiriman wajib diisi untuk layanan antar." },
        { status: 400 }
      );
    }

    if (!["transfer", "qris"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Metode pembayaran tidak valid." }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Keranjang belanja kosong." }, { status: 400 });
    }

    // 2. Generate temporary ref to generate guest token
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidateRef = `PEA-${dateStr}-${randomSuffix}`;
    const { hash: guestTokenHash } = generateGuestToken(candidateRef);

    // 3. Check Supabase connection
    const supabase = createClient();

    let createdRef = candidateRef;
    let subtotal = 0;
    let deliveryFee: number | null = deliveryMethod === "pickup" ? 0 : null;
    let totalAmount = 0;
    let storeWhatsappNumber = "081234567890";

    // Read profile store whatsapp if present
    try {
      const profilePath = path.join(process.cwd(), "data", "store-profile.json");
      if (fs.existsSync(profilePath)) {
        const profRaw = fs.readFileSync(profilePath, "utf-8");
        const prof = JSON.parse(profRaw);
        if (prof?.whatsapp) storeWhatsappNumber = prof.whatsapp;
      }
    } catch {}

    if (supabase) {
      // Fetch store settings for WhatsApp number
      const { data: settings } = await supabase
        .from("store_settings")
        .select("whatsapp_number")
        .eq("is_active", true)
        .single();

      if (settings?.whatsapp_number) {
        storeWhatsappNumber = settings.whatsapp_number;
      }

      // Check WhatsApp number requirement before ordering
      if (!storeWhatsappNumber || storeWhatsappNumber.trim() === "") {
        return NextResponse.json(
          { error: "Pemesanan sementara belum dapat diproses karena nomor kontak toko belum diatur." },
          { status: 400 }
        );
      }

      // Format items payload for stored procedure
      const orderPayload = {
        idempotency_key: idempotencyKey || null,
        customer_name: customerName.trim(),
        customer_phone: cleanPhone,
        delivery_method: deliveryMethod,
        delivery_address: deliveryMethod === "delivery" ? deliveryAddress.trim() : "Ambil Sendiri di Outlet Makassar",
        address_landmark: addressLandmark ? addressLandmark.trim() : null,
        payment_method: paymentMethod,
        order_notes: orderNotes ? orderNotes.trim() : null,
        guest_token_hash: guestTokenHash,
        items: items.map((i: any) => ({
          product_id: i.productId,
          size: i.size || "regular",
          quantity: i.quantity,
          flavors: i.flavorCombo || (i.flavorChoices?.map((fc: any) => fc.flavorName)) || [i.name],
          flavor_choices: (i.flavorChoices || []).map((fc: any) => ({
            flavor_id: fc.flavorId,
            choice_label: fc.choiceLabel,
            choice_index: fc.choiceIndex,
          })),
          notes: i.notes || null,
        })),
      };

      // Call Atomic Stored Procedure
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        "create_customer_order",
        { order_payload: orderPayload }
      );

      if (rpcError) {
        return NextResponse.json(
          { error: rpcError.message || "Gagal membuat pesanan di database." },
          { status: 400 }
        );
      }

      createdRef = rpcResult.ref;
      subtotal = rpcResult.subtotal;
      deliveryFee = rpcResult.delivery_fee;
      totalAmount = rpcResult.total_amount;
    } else {
      // Supabase is not configured: calculate safely in-memory
      items.forEach((item: any) => {
        subtotal += (item.price || 0) * (item.quantity || 1);
      });
      totalAmount = subtotal + (deliveryFee || 0);

      // Save fallback order to disk
      saveFallbackOrder({
        id: `local-${Date.now()}`,
        ref: createdRef,
        customer_name: customerName.trim(),
        customer_phone: cleanPhone,
        delivery_method: deliveryMethod,
        delivery_address: deliveryMethod === "delivery" ? deliveryAddress.trim() : "Ambil Sendiri di Outlet Makassar",
        address_landmark: addressLandmark ? addressLandmark.trim() : null,
        payment_method: paymentMethod,
        order_notes: orderNotes ? orderNotes.trim() : null,
        subtotal,
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
        order_status: "pending",
        payment_status: "unpaid",
        stock_deducted: false,
        guest_token_hash: guestTokenHash,
        created_at: new Date().toISOString(),
        items: items.map((i: any) => ({
          product_id: i.productId,
          product_name_snapshot: i.name,
          quantity: i.quantity,
          size: i.size || "regular",
          unit_price: i.price,
          subtotal: (i.price || 0) * (i.quantity || 1),
          flavor_snapshot: i.flavorCombo || (i.flavorChoices?.map((fc: any) => fc.flavorName)) || [i.name],
          flavor_choices: i.flavorChoices || [],
          notes: i.notes || null,
        })),
      });
    }

    // Generate definitive guest token signed for createdRef
    const { token: finalGuestToken } = generateGuestToken(createdRef);

    // 4. Compose clean WhatsApp Message with structured flavor breakdown
    const itemsListText = items
      .map((i: any, idx: number) => {
        let flavorLines = "";
        if (i.flavorChoices && Array.isArray(i.flavorChoices) && i.flavorChoices.length > 0) {
          const names = i.flavorChoices
            .map((fc: any) => `${fc.flavorName}${fc.extraPrice > 0 ? ` (+Rp ${Number(fc.extraPrice).toLocaleString("id-ID")})` : ""}`)
            .join(", ");
          flavorLines = `   Pilihan rasa: ${names}`;
        } else if (i.flavorCombo && i.flavorCombo.length > 0) {
          flavorLines = `   Rasa: ${i.flavorCombo.join(" + ")}`;
        }

        const sizeLabel = CUP_SIZE_LABELS[i.size as keyof typeof CUP_SIZE_LABELS] || i.size;
        const sizeText = sizeLabel && sizeLabel !== "regular" && sizeLabel !== "small" ? ` (${sizeLabel})` : "";

        return `${idx + 1}. *${i.name}*${sizeText} x${i.quantity}\n${flavorLines ? flavorLines + "\n" : ""}   Harga: Rp ${(i.price || 0).toLocaleString("id-ID")}${i.notes ? `\n   Catatan: ${i.notes}` : ""}`;
      })
      .join("\n\n");

    const waMessage = `Halo Pea Ice Cream Makassar! 🍦\nSaya ingin konfirmasi pesanan baru:\n\n*No. Ref:* ${createdRef}\n*Nama:* ${customerName.trim()}\n*WhatsApp:* ${customerPhone.trim()}\n*Pengiriman:* ${deliveryMethod === "delivery" ? `Antar ke Alamat\nAlamat: ${deliveryAddress.trim()}${addressLandmark ? `\nPatokan: ${addressLandmark.trim()}` : ""}` : "Ambil Sendiri di Outlet Makassar"}\n*Metode Bayar:* ${paymentMethod === "qris" ? "QRIS (Manual Verifikasi)" : "Transfer Bank (Manual Verifikasi)"}\n\n*Rincian Menu:*\n${itemsListText}\n\n*Subtotal Produk:* Rp ${subtotal.toLocaleString("id-ID")}\n*Ongkir:* ${deliveryMethod === "delivery" ? "Menunggu Konfirmasi Admin" : "Rp 0 (Ambil Sendiri)"}\n${orderNotes ? `\n*Catatan Khusus:* ${orderNotes.trim()}` : ""}\n\nMohon info ketersediaan stok & petunjuk pembayarannya. Terima kasih!`;

    const cleanWaTarget = storeWhatsappNumber.replace(/\D/g, "");
    const formattedWaTarget = cleanWaTarget.startsWith("0")
      ? "62" + cleanWaTarget.slice(1)
      : cleanWaTarget;

    const waUrl = `https://wa.me/${formattedWaTarget}?text=${encodeURIComponent(waMessage)}`;

    // 5. Create Response and set secure HttpOnly guest cookie
    const response = NextResponse.json({
      success: true,
      ref: createdRef,
      subtotal,
      deliveryFee,
      totalAmount,
      waMessage,
      waUrl,
      whatsappNumber: storeWhatsappNumber,
    });

    // Set HttpOnly cookie for 7 days so this guest browser can securely view /pesanan/[ref]
    response.cookies.set(`pea_guest_token_${createdRef}`, finalGuestToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Order creation error:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan internal saat memproses pesanan." },
      { status: 500 }
    );
  }
}
