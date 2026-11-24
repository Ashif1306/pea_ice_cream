import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { autoplay, intervalSeconds, transitionMs, bottomEffect } = body;

    const validatedAutoplay = typeof autoplay === "boolean" ? autoplay : true;
    const validatedInterval = Math.min(20, Math.max(3, parseInt(intervalSeconds, 10) || 6));
    const validatedTransition = Math.min(1500, Math.max(300, parseInt(transitionMs, 10) || 1200));

    const allowedDividers = [
      "melting-wave",
      "ice-drips",
      "cloud-puffs",
      "layered-swirl",
      "zigzag-waffle",
      "smooth-curve",
      "dripping-scallop",
      "flat-clean",
    ];
    const validatedEffect = allowedDividers.includes(bottomEffect) ? bottomEffect : "melting-wave";

    const supabase = createClient();
    if (supabase) {
      try {
        const updateData: any = {
          carousel_autoplay: validatedAutoplay,
          carousel_interval_seconds: validatedInterval,
          carousel_transition_ms: validatedTransition,
          carousel_bottom_effect: validatedEffect,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("store_settings")
          .update(updateData)
          .eq("is_active", true);

        if (error && error.message.includes("carousel_bottom_effect")) {
          delete updateData.carousel_bottom_effect;
          await supabase.from("store_settings").update(updateData).eq("is_active", true);
        }
      } catch (e: any) {
        console.warn("DB update banner settings fallback:", e?.message);
      }
    }

    return NextResponse.json({
      success: true,
      settings: {
        autoplay: validatedAutoplay,
        intervalSeconds: validatedInterval,
        transitionMs: validatedTransition,
        bottomEffect: validatedEffect,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menyimpan pengaturan" }, { status: 500 });
  }
}
