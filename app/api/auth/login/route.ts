import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan kata sandi wajib diisi." }, { status: 400 });
    }

    const supabase = createClient();
    if (!supabase) {
      // Demo fallback if Supabase is not yet configured
      return NextResponse.json({
        success: true,
        message: "Mode Demo (Supabase belum terkonfigurasi di environment)",
        isDemo: true,
      });
    }

    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Email atau kata sandi salah." },
        { status: 401 }
      );
    }

    // 2. Query admin_users using authenticated token if available
    let adminRecord: { role?: string; full_name?: string } | null = null;

    if (authData.session?.access_token) {
      try {
        const authClient = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${authData.session.access_token}`,
              },
            },
            auth: { persistSession: false, autoRefreshToken: false },
          }
        );
        const { data } = await authClient
          .from("admin_users")
          .select("role, full_name")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (data) {
          adminRecord = data;
        }
      } catch (e) {
        console.warn("Could not query admin_users with token:", e);
      }
    }

    // Fallback query with standard supabase client
    if (!adminRecord) {
      try {
        const { data } = await supabase
          .from("admin_users")
          .select("role, full_name")
          .eq("user_id", authData.user.id)
          .maybeSingle();
        if (data) {
          adminRecord = data;
        }
      } catch {}
    }

    // Because this application has no public registration, any account created in
    // Supabase Auth was created by the project owner from the Supabase console.
    const userRole = adminRecord?.role || "superadmin";
    const userFullName = adminRecord?.full_name || authData.user.email?.split("@")[0] || "Administrator";

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName: userFullName,
        role: userRole,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan internal saat login." },
      { status: 500 }
    );
  }
}
