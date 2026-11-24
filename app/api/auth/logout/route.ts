import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }

    const response = NextResponse.json({ success: true, message: "Berhasil logout." });
    return response;
  } catch (err: any) {
    console.error("Logout error:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan saat logout." },
      { status: 500 }
    );
  }
}
