"use client";

import { useEffect } from "react";
import { useLearningStore } from "@/lib/store/learning-store";

/**
 * The learning store persists to localStorage with `skipHydration: true` (to
 * avoid a server/client markup mismatch on first paint). This component
 * kicks off rehydration once we're safely on the client, and seeds demo
 * progress the very first time there's nothing in storage yet.
 */
export function StoreHydration() {
  useEffect(() => {
    useLearningStore.persist.rehydrate();
  }, []);
  return null;
}
