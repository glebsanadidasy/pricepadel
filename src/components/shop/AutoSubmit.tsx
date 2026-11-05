"use client";

import { useEffect, useRef } from "react";

/**
 * Submits the surrounding filter form as soon as a checkbox, radio or select changes.
 * Without JavaScript the form still works through its "Show results" button.
 */
export function AutoSubmit() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement;
      if (t.type === "search" || t.type === "text") return;
      form.requestSubmit();
    };
    form.addEventListener("change", onChange);
    return () => form.removeEventListener("change", onChange);
  }, []);
  return <span ref={ref} hidden />;
}
