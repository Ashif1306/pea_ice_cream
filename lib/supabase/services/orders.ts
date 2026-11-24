import { createClient } from "@/lib/supabase/client";

export async function adminFetchOrders(): Promise<any[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      items:order_items(*)
    `)
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new Error(error?.message || "Gagal memuat daftar pesanan.");
  }

  return data.map((o) => ({
    id: o.id,
    ref: o.ref,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    deliveryMethod: o.delivery_method,
    deliveryAddress: o.delivery_address,
    paymentMethod: o.payment_method,
    subtotal: o.subtotal,
    deliveryFee: o.delivery_fee,
    totalAmount: o.total_amount,
    orderStatus: o.order_status,
    paymentStatus: o.payment_status,
    stockDeducted: o.stock_deducted,
    createdAt: o.created_at,
    items: (o.items || []).map((i: any) => ({
      name: i.product_name_snapshot,
      quantity: i.quantity,
      size: i.size,
      price: i.unit_price,
      flavors: i.flavor_snapshot,
    })),
  }));
}

export async function adminFetchOrderByRef(ref: string): Promise<any | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data: o, error } = await supabase
    .from("orders")
    .select(`
      *,
      items:order_items(*),
      history:order_status_history(*)
    `)
    .eq("ref", ref)
    .single();

  if (error || !o) return null;

  return {
    id: o.id,
    ref: o.ref,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    deliveryMethod: o.delivery_method,
    deliveryAddress: o.delivery_address,
    addressLandmark: o.address_landmark,
    paymentMethod: o.payment_method,
    orderNotes: o.order_notes,
    subtotal: o.subtotal,
    deliveryFee: o.delivery_fee,
    totalAmount: o.total_amount,
    orderStatus: o.order_status,
    paymentStatus: o.payment_status,
    stockDeducted: o.stock_deducted,
    createdAt: o.created_at,
    items: (o.items || []).map((i: any) => ({
      productId: i.product_id,
      name: i.product_name_snapshot,
      quantity: i.quantity,
      size: i.size,
      price: i.unit_price,
      flavorCombo: i.flavor_snapshot,
      flavorChoices: i.flavor_choices || [],
      basePrice: i.base_price_snapshot,
      notes: i.notes,
    })),
    history: o.history || [],
  };
}

export async function adminExecuteOrderAction(payload: {
  orderId: string;
  action?: "confirm" | "cancel" | "update";
  orderStatus?: string;
  paymentStatus?: string;
  deliveryFee?: number;
  note?: string;
}): Promise<any> {
  const res = await fetch("/api/admin/order-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Gagal memproses aksi pesanan");
  }
  return data;
}
