import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Admin Client dengan Service Role Key.
 * HANYA boleh digunakan di server untuk operasi khusus (misal: verifikasi admin, operasi sistem).
 * JANGAN PERNAH diekspos ke sisi klien/browser!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
