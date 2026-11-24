import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyGuestToken } from "@/lib/supabase/guest-token";
import fs from "fs";
import path from "path";

const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json");

function getFallbackOrder(ref: string) {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = fs.readFileSync(ORDERS_FILE, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return list.find((o: any) => o.ref === ref) || null;
      }
    }
  } catch (e) {
    console.error("Gagal membaca fallback order:", e);
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { ref: string } }
) {
  try {
    const ref = params.ref;
    if (!ref) {
      return NextResponse.json({ error: "Nomor referensi pesanan diperlukan." }, { status: 400 });
    }

    const supabase = createClient();
    const guestCookie = request.cookies.get(`pea_guest_token_${ref}`)?.value;
    const isGuestAuthorized = verifyGuestToken(ref, guestCookie);

    let isAdmin = false;

    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: adminRecord } = await supabase
          .from("admin_users")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (adminRecord) {
          isAdmin = true;
        }
      }
    }

    // Must be either the guest owner (with signed cookie) OR an authorized admin
    if (!isGuestAuthorized && !isAdmin) {
      return NextResponse.json(
        {
          error:
            "Akses ditolak: Anda tidak memiliki otorisasi untuk melihat detail pesanan ini demi privasi pelanggan.",
        },
        { status: 403 }
      );
    }

    if (!supabase) {
      const fallbackOrder = getFallbackOrder(ref);
      if (fallbackOrder) {
        return NextResponse.json({ success: true, order: fallbackOrder });
      }
      return NextResponse.json({
        error: "Database belum terhubung.",
        isFallback: true,
      });
    }

    // Fetch order details from Supabase
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        items:order_items(*),
        history:order_status_history(*)
      `)
      .eq("ref", ref)
      .single();

    if (orderError || !order) {
      // Check fallback file in case order was made locally
      const fallbackOrder = getFallbackOrder(ref);
      if (fallbackOrder) {
        return NextResponse.json({ success: true, order: fallbackOrder });
      }
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error("Error fetching order:", err);
    return NextResponse.json(
      { error: err.message || "Gagal mengambil data pesanan." },
      { status: 500 }
    );
  }
}
