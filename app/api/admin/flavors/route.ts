import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs/promises";
import path from "path";

const FLAVORS_FILE_PATH = path.join(process.cwd(), "data", "flavors.json");

interface FlavorRecord {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  isAvailable: boolean;
  orderIdx: number;
  createdAt?: string;
  updatedAt?: string;
}

async function readFlavorsFromFile(): Promise<FlavorRecord[]> {
  try {
    const raw = await fs.readFile(FLAVORS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // File not created yet
  }
  return [];
}

async function writeFlavorsToFile(flavors: FlavorRecord[]): Promise<void> {
  try {
    const dir = path.dirname(FLAVORS_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(FLAVORS_FILE_PATH, JSON.stringify(flavors, null, 2), "utf-8");
  } catch (err) {
    console.error("Gagal menulis flavors.json:", err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    // 1. Try file
    const fileFlavors = await readFlavorsFromFile();
    if (fileFlavors.length > 0) {
      const result = activeOnly ? fileFlavors.filter((f) => f.isActive) : fileFlavors;
      return NextResponse.json({ success: true, flavors: result, source: "file" });
    }

    // 2. Try Supabase
    try {
      const supabase = createClient();
      if (supabase) {
        let query = supabase.from("flavors").select("*").order("order_idx", { ascending: true });
        if (activeOnly) {
          query = query.eq("is_active", true);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const mapped: FlavorRecord[] = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            slug: d.slug,
            description: d.description || "",
            imageUrl: d.image_url || "",
            isActive: d.is_active,
            isAvailable: d.is_available,
            orderIdx: d.order_idx,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
          await writeFlavorsToFile(mapped);
          return NextResponse.json({ success: true, flavors: mapped, source: "supabase" });
        }
      }
    } catch (e) {
      console.warn("Supabase flavors read warning:", e);
    }

    // Default empty (no auto-generated data, as requested)
    return NextResponse.json({ success: true, flavors: [], source: "empty" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, imageUrl, isActive, isAvailable, orderIdx } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ success: false, error: "Nama rasa wajib diisi." }, { status: 400 });
    }

    const trimmedName = name.trim();
    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const fileFlavors = await readFlavorsFromFile();
    const existingIndex = id ? fileFlavors.findIndex((f) => f.id === id) : -1;

    const record: FlavorRecord = {
      id: id || crypto.randomUUID(),
      name: trimmedName,
      slug,
      description: description?.trim() || "",
      imageUrl: imageUrl || "",
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      orderIdx: Number(orderIdx) || (existingIndex >= 0 ? fileFlavors[existingIndex].orderIdx : fileFlavors.length + 1),
      updatedAt: new Date().toISOString(),
      createdAt: existingIndex >= 0 ? fileFlavors[existingIndex].createdAt : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      fileFlavors[existingIndex] = record;
    } else {
      fileFlavors.push(record);
    }

    // Save to file
    await writeFlavorsToFile(fileFlavors);

    // Sync to Supabase
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.from("flavors").upsert({
          id: record.id,
          name: record.name,
          slug: record.slug,
          description: record.description,
          image_url: record.imageUrl,
          is_active: record.isActive,
          is_available: record.isAvailable,
          order_idx: record.orderIdx,
          updated_at: record.updatedAt,
        });
      }
    } catch (err: any) {
      console.warn("Supabase flavor sync warning:", err.message);
    }

    return NextResponse.json({
      success: true,
      flavor: record,
      message: `Rasa "${record.name}" berhasil disimpan!`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isAvailable, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID rasa wajib disertakan." }, { status: 400 });
    }

    const fileFlavors = await readFlavorsFromFile();
    const index = fileFlavors.findIndex((f) => f.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: "Rasa tidak ditemukan." }, { status: 404 });
    }

    if (isAvailable !== undefined) {
      fileFlavors[index].isAvailable = Boolean(isAvailable);
    }
    if (isActive !== undefined) {
      fileFlavors[index].isActive = Boolean(isActive);
    }
    fileFlavors[index].updatedAt = new Date().toISOString();

    await writeFlavorsToFile(fileFlavors);

    // Sync to Supabase
    try {
      const supabase = createClient();
      if (supabase) {
        const updatePayload: any = { updated_at: new Date().toISOString() };
        if (isAvailable !== undefined) updatePayload.is_available = isAvailable;
        if (isActive !== undefined) updatePayload.is_active = isActive;
        await supabase.from("flavors").update(updatePayload).eq("id", id);
      }
    } catch (err: any) {
      console.warn("Supabase flavor patch warning:", err.message);
    }

    return NextResponse.json({
      success: true,
      flavor: fileFlavors[index],
      message: "Status rasa berhasil diperbarui.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
