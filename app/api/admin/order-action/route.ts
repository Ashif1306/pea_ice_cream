import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database belum terhubung." }, { status: 503 });
    }

    // Check admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { data: adminRecord } = await supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!adminRecord) {
      return NextResponse.json({ error: "Akses ditolak: Bukan admin terdaftar." }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, action, orderStatus, paymentStatus, deliveryFee, note } = body;

    if (!orderId) {
      return NextResponse.json({ error: "ID pesanan diperlukan." }, { status: 400 });
    }

    // 1. Confirm order action (Atomic stock deduction)
    if (action === "confirm") {
      const { data, error } = await supabase.rpc("confirm_and_deduct_order_stock", {
        p_order_id: orderId,
        p_admin_id: user.id,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data });
    }

    // 2. Cancel order action (Atomic stock restore)
    if (action === "cancel") {
      const { data, error } = await supabase.rpc("cancel_and_restore_order_stock", {
        p_order_id: orderId,
        p_admin_id: user.id,
        p_reason: note || "Dibatalkan oleh admin",
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data });
    }

    // 3. Regular status updates (payment status, delivery fee, order status progression)
    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (orderStatus) updatePayload.order_status = orderStatus;
    if (paymentStatus) updatePayload.payment_status = paymentStatus;
    if (deliveryFee !== undefined) updatePayload.delivery_fee = deliveryFee;

    const { error: updateError } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Log status history
    if (orderStatus) {
      await supabase.from("order_status_history").insert({
        order_id: orderId,
        to_status: orderStatus,
        note: note || `Status diperbarui menjadi ${orderStatus}`,
        changed_by: user.id,
      });
    }

    return NextResponse.json({ success: true, message: "Status pesanan berhasil diperbarui." });
  } catch (err: any) {
    console.error("Order action error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memproses aksi pesanan." },
      { status: 500 }
    );
  }
}
