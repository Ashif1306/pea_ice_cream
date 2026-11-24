import { createClient } from "@/lib/supabase/client";
import { CupSize } from "@/lib/constants";

export interface InventoryRow {
  id: string;
  productId: string;
  productName: string;
  flavorId: string;
  flavorName: string;
  size: CupSize;
  quantity: number;
}

export async function adminFetchInventoryMatrix(): Promise<Record<string, Record<CupSize, { id: string; quantity: number }>>> {
  const supabase = createClient();
  if (!supabase) return {};

  const { data, error } = await supabase
    .from("inventory")
    .select(`
      id,
      size,
      quantity,
      product:products(id, name),
      flavor:product_flavors(id, name)
    `);

  if (error || !data) return {};

  const matrix: Record<string, Record<CupSize, { id: string; quantity: number }>> = {};

  data.forEach((row: any) => {
    const key = `${row.product?.name || "Produk"} - ${row.flavor?.name || "Rasa"}`;
    if (!matrix[key]) {
      matrix[key] = {
        small: { id: "", quantity: 0 },
        medium: { id: "", quantity: 0 },
        large: { id: "", quantity: 0 },
      };
    }
    matrix[key][row.size as CupSize] = {
      id: row.id,
      quantity: row.quantity,
    };
  });

  return matrix;
}

export async function adminUpdateInventoryStock(inventoryId: string, quantity: number): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase belum terhubung");

  const { error } = await supabase
    .from("inventory")
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq("id", inventoryId);

  if (error) throw new Error(error.message);
}
