"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-reads the page every few seconds for a short while (e.g. while a payment is being confirmed). */
export function AutoRefresh({ everyMs = 4000, forMs = 120000 }: { everyMs?: number; forMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const started = Date.now();
    const t = setInterval(() => (Date.now() - started > forMs ? clearInterval(t) : router.refresh()), everyMs);
    return () => clearInterval(t);
  }, [router, everyMs, forMs]);
  return null;
}
