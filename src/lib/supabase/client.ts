import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for browser-side (Client Components).
 * Uses the public anon key — RLS enforces authorization.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
