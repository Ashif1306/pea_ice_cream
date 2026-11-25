import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import fs from "fs/promises";
import path from "path";

const PROD_FLAVORS_FILE = path.join(process.cwd(), "data", "product-flavor-configs.json");
const FLAVORS_FILE = path.join(process.cwd(), "data", "flavors.json");

interface ProductFlavorConfigRecord {
  id: string;
  productId: string;
  flavorId: string;
  extraPrice: number;
  orderIdx: number;
  isActive: boolean;
  updatedAt?: string;
}

async function readConfigs(): Promise<ProductFlavorConfigRecord[]> {
  try {
    const raw = await fs.readFile(PROD_FLAVORS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}

async function writeConfigs(configs: ProductFlavorConfigRecord[]): Promise<void> {
  try {
    const dir = path.dirname(PROD_FLAVORS_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(PROD_FLAVORS_FILE, JSON.stringify(configs, null, 2), "utf-8");
  } catch (e) {
    console.error("Gagal menulis product-flavor-configs.json:", e);
  }
}

async function readFlavorsDict(): Promise<Record<string, { name: string; imageUrl?: string; isAvailable: boolean; isActive: boolean }>> {
  try {
    const raw = await fs.readFile(FLAVORS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const map: Record<string, any> = {};
      for (const f of parsed) {
        map[f.id] = {
          name: f.name,
          imageUrl: f.imageUrl,
          isAvailable: f.isAvailable !== false,
          isActive: f.isActive !== false,
        };
      }
      return map;
    }
  } catch {}
  return {};
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ success: false, error: "productId parameter required" }, { status: 400 });
    }

    const allConfigs = await readConfigs();
    const productConfigs = allConfigs.filter((c) => c.productId === productId && c.isActive);
    const flavorsMap = await readFlavorsDict();

    const enriched = productConfigs.map((c) => {
      const meta = flavorsMap[c.flavorId] || {};
      return {
        ...c,
        flavorName: meta.name || "Rasa",
        flavorImageUrl: meta.imageUrl || "",
        isFlavorAvailable: meta.isAvailable !== false,
      };
    });

    return NextResponse.json({ success: true, configs: enriched });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, configs } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: "productId wajib diisi" }, { status: 400 });
    }

    if (!Array.isArray(configs)) {
      return NextResponse.json({ success: false, error: "configs harus berupa array" }, { status: 400 });
    }

    // Validation: extra_price >= 0
    for (const c of configs) {
      if (typeof c.extraPrice === "number" && c.extraPrice < 0) {
        return NextResponse.json(
          { success: false, error: "Tambahan harga tidak boleh negatif." },
          { status: 400 }
        );
      }
    }

    const allConfigs = await readConfigs();
    // Remove old active configs for this product
    const otherConfigs = allConfigs.filter((c) => c.productId !== productId);

    const newConfigs: ProductFlavorConfigRecord[] = configs.map((c, idx) => ({
      id: c.id || crypto.randomUUID(),
      productId,
      flavorId: c.flavorId,
      extraPrice: Math.max(0, Number(c.extraPrice) || 0),
      orderIdx: idx + 1,
      isActive: c.isActive !== false,
      updatedAt: new Date().toISOString(),
    }));

    const combined = [...otherConfigs, ...newConfigs];
    await writeConfigs(combined);

    // Sync to Supabase
    try {
      const supabase = createAdminClient() || createClient();
      if (supabase) {
        // Delete old configs for product
        await supabase.from("product_flavor_configs").delete().eq("product_id", productId);

        if (newConfigs.length > 0) {
          const insertPayload = newConfigs.map((c) => ({
            id: c.id,
            product_id: c.productId,
            flavor_id: c.flavorId,
            extra_price: c.extraPrice,
            order_idx: c.orderIdx,
            is_active: c.isActive,
            updated_at: c.updatedAt,
          }));
          await supabase.from("product_flavor_configs").insert(insertPayload);
        }
      }
    } catch (err: any) {
      console.warn("Supabase product_flavor_configs sync warning:", err.message);
    }

    return NextResponse.json({
      success: true,
      configs: newConfigs,
      message: "Konfigurasi rasa produk berhasil disimpan!",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
