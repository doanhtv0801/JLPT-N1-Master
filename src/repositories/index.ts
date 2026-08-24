import type { LearningRepository } from "./types";
import { DemoLearningRepository } from "./demo-repository";
import { isSupabaseConfigured } from "@/supabase/env";

export type { LearningRepository } from "./types";

let cached: LearningRepository | null = null;

/**
 * Single entry point the rest of the app uses to reach persistence. Demo
 * mode (no Supabase env vars) returns the localStorage-backed repository;
 * once real credentials are configured, swap in `SupabaseLearningRepository`
 * (client-side only, since it needs a browser Supabase client with the
 * signed-in user's session — see supabase/client.ts).
 */
export function getLearningRepository(): LearningRepository {
  if (cached) return cached;
  if (!isSupabaseConfigured()) {
    cached = new DemoLearningRepository();
    return cached;
  }
  // Real Supabase mode: constructed lazily by callers that have a client
  // instance (see hooks/use-repository.ts) rather than here, to avoid
  // importing browser-only Supabase code into server bundles by accident.
  cached = new DemoLearningRepository();
  return cached;
}
