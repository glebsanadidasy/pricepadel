"use client";

import { useState, useTransition } from "react";
import { checkGatewayConnection } from "@/app/admin/actions";

export function GatewayCheck() {
  const [result, setResult] = useState<{ connected: boolean; detail: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="mt-[10px] flex flex-wrap items-center gap-[10px]">
      <button type="button" disabled={pending} onClick={() => start(async () => setResult(await checkGatewayConnection()))} className="inline-flex h-[38px] items-center bg-royal px-[18px] text-[14px] font-bold text-white disabled:opacity-60">
        {pending ? "Checking…" : "Test connection"}
      </button>
      {result && (
        <span role="status" className={`text-[14px] font-bold ${result.connected ? "text-[#2e7d32]" : "text-[#c0392b]"}`}>
          {result.connected ? "Connected" : "Not connected"} — {result.detail}
        </span>
      )}
    </div>
  );
}
