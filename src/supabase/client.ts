"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "./env";

/**
 * Browser-side Supabase client. Only ever call this after checking
 * `isSupabaseConfigured()` — in demo mode (no env vars set) the app never
 * touches Supabase at all and uses the local demo repository instead.
 */
export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Check isSupabaseConfigured() before calling createClient()."
    );
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
