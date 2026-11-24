import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs/promises";
import path from "path";

const PROFILE_FILE_PATH = path.join(process.cwd(), "data", "store-profile.json");

export interface StoreProfilePayload {
  businessName: string;
  tagline1: string;
  tagline2: string;
  tagline3: string;
  description: string;
  whatsappNumber: string;
  whatsappMessage?: string;
  instagram: string;
  tiktok?: string;
  email?: string;
  address: string;
  city: string;
  hours: string;
  logoUrl: string;
}

const DEFAULT_PROFILE: StoreProfilePayload = {
  businessName: "Pea Ice Cream",
  tagline1: "ice cream classic",
  tagline2: "homemade ice cream",
  tagline3: "sehat tanpa pengawet",
  description: "Es krim artisan premium homemade Makassar dengan tekstur lembut dan manis yang pas.",
  whatsappNumber: "081234567890",
  whatsappMessage: "Halo Pea Ice Cream, saya ingin bertanya tentang menu es krim dan pemesanan.",
  instagram: "@pea.icecream",
  tiktok: "@pea.icecream",
  email: "peaicecream@gmail.com",
  address: "Jl. Sungai Kelara 38, Makassar",
  city: "Makassar, Sulawesi Selatan",
  hours: "Everyday 10.00 – 18.00 WITA (Main Store) • 10.00 – 22.00 WITA (Mall)",
  logoUrl: "/logo.jpg",
};

async function readProfileFromFile(): Promise<StoreProfilePayload | null> {
  try {
    const raw = await fs.readFile(PROFILE_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return { ...DEFAULT_PROFILE, ...parsed };
    }
  } catch {
    // File doesn't exist yet
  }
  return null;
}

async function writeProfileToFile(profile: StoreProfilePayload): Promise<void> {
  try {
    const dir = path.dirname(PROFILE_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(PROFILE_FILE_PATH, JSON.stringify(profile, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write store-profile.json:", err);
  }
}

export async function GET() {
  try {
    // 1. Check local persistent file first
    const fromFile = await readProfileFromFile();
    if (fromFile) {
      return NextResponse.json({ success: true, profile: fromFile, source: "file" });
    }

    // 2. Try Supabase
    try {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("store_settings")
          .select("*")
          .eq("is_active", true)
          .maybeSingle();

        if (!error && data) {
          const profile: StoreProfilePayload = {
            businessName: data.business_name || DEFAULT_PROFILE.businessName,
            tagline1: data.taglines?.[0] || DEFAULT_PROFILE.tagline1,
            tagline2: data.taglines?.[1] || DEFAULT_PROFILE.tagline2,
            tagline3: data.pending_verification_tagline || DEFAULT_PROFILE.tagline3,
            description: data.description || DEFAULT_PROFILE.description,
            whatsappNumber: data.whatsapp_number || DEFAULT_PROFILE.whatsappNumber,
            whatsappMessage: DEFAULT_PROFILE.whatsappMessage,
            instagram: data.instagram || DEFAULT_PROFILE.instagram,
            tiktok: data.tiktok || DEFAULT_PROFILE.tiktok,
            email: DEFAULT_PROFILE.email,
            address: data.address || DEFAULT_PROFILE.address,
            city: data.city || DEFAULT_PROFILE.city,
            hours: typeof data.business_hours === "string" ? data.business_hours : DEFAULT_PROFILE.hours,
            logoUrl: data.logo_url || DEFAULT_PROFILE.logoUrl,
          };
          return NextResponse.json({ success: true, profile, source: "supabase" });
        }
      }
    } catch (e) {
      console.warn("Supabase profile read error:", e);
    }

    // 3. Fallback
    return NextResponse.json({ success: true, profile: DEFAULT_PROFILE, source: "default" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const profile: StoreProfilePayload = { ...DEFAULT_PROFILE, ...body };

    // 1. Write to persistent file
    await writeProfileToFile(profile);

    // 2. Sync to Supabase
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.from("store_settings").upsert({
          id: "00000000-0000-0000-0000-000000000001",
          business_name: profile.businessName,
          tagline_primary: `${profile.tagline1} • ${profile.tagline2}`,
          taglines: [profile.tagline1, profile.tagline2],
          pending_verification_tagline: profile.tagline3,
          description: profile.description,
          whatsapp_number: profile.whatsappNumber,
          instagram: profile.instagram,
          tiktok: profile.tiktok || "@pea.icecream",
          address: profile.address,
          city: profile.city,
          business_hours: profile.hours,
          logo_url: profile.logoUrl,
          is_active: true,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.warn("Supabase store_settings sync warning:", err.message);
    }

    return NextResponse.json({
      success: true,
      profile,
      message: "Profil usaha, WhatsApp, dan media sosial berhasil disimpan!",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
