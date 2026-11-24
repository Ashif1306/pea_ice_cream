import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase Client untuk komponen browser (Client Components).
 * Otomatis menangani sesi dan token JWT yang tersimpan di cookies.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Kembalikan null jika variabel environment belum dikonfigurasi
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
