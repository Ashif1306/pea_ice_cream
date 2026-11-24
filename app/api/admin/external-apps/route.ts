import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PARTNER_APPS, DeliveryAppItem } from "@/lib/apps-data";
import fs from "fs/promises";
import path from "path";

const DATA_FILE_PATH = path.join(process.cwd(), "data", "external-apps.json");

async function readFromFile(): Promise<DeliveryAppItem[] | null> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // File doesn't exist or error reading
  }
  return null;
}

async function writeToFile(apps: DeliveryAppItem[]): Promise<void> {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(apps, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write to external-apps.json:", err);
  }
}

export async function GET() {
  try {
    // 1. Check local persistent file first
    const fileData = await readFromFile();
    if (fileData && fileData.length > 0) {
      return NextResponse.json({ success: true, apps: fileData, source: "file" });
    }

    // 2. Try Supabase
    try {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("external_delivery_apps")
          .select("*")
          .order("order_idx", { ascending: true });

        if (!error && data && data.length > 0) {
          // Check if data is customized or just old 2 seed rows
          const hasGoFood = data.some((d: any) => d.name?.toLowerCase().includes("go"));
          if (hasGoFood) {
            return NextResponse.json({ success: true, apps: data, source: "supabase" });
          }
        }
      }
    } catch (e) {
      console.warn("Supabase fetch external apps error:", e);
    }

    // 3. Fallback to DEFAULT_PARTNER_APPS
    return NextResponse.json({ success: true, apps: DEFAULT_PARTNER_APPS, source: "default" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apps: DeliveryAppItem[] = body.apps || body;

    if (!Array.isArray(apps)) {
      return NextResponse.json({ error: "Invalid data format: expected array" }, { status: 400 });
    }

    // 1. Persist to server file storage (guaranteed to survive restarts & refreshes)
    await writeToFile(apps);

    // 2. Attempt sync to Supabase database
    try {
      const supabase = createClient();
      if (supabase) {
        for (let i = 0; i < apps.length; i++) {
          const a = apps[i];
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a.id || "");
          await supabase.from("external_delivery_apps").upsert({
            ...(isUuid ? { id: a.id } : {}),
            name: a.name,
            url: a.url,
            icon: a.icon || null,
            order_idx: i + 1,
            is_active: a.is_active !== false,
          });
        }
      }
    } catch (supabaseErr: any) {
      console.warn("Supabase external_delivery_apps sync warning:", supabaseErr.message);
    }

    return NextResponse.json({ success: true, apps, message: "Aplikasi dan logo berhasil disimpan!" });
  } catch (err: any) {
    console.error("Save external apps error:", err);
    return NextResponse.json({ error: err.message || "Gagal menyimpan aplikasi" }, { status: 500 });
  }
}
