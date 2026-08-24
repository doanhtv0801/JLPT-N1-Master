"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured } from "@/supabase/env";

/**
 * In demo mode (no Supabase credentials configured), the app is usable
 * immediately with no login wall — this is a hard product requirement (see
 * spec: "must run end-to-end with zero configuration"). Once real Supabase
 * credentials are supplied, this gate starts enforcing an actual session.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(!isSupabaseConfigured());

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let active = true;
    import("@/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data }) => {
        if (!active) return;
        if (!data.session) {
          router.replace("/login");
        } else {
          setChecked(true);
        }
      });
    });
    return () => {
      active = false;
    };
  }, [router]);

  if (!checked) return null;
  return <>{children}</>;
}
