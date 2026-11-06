import type { Metadata } from "next";
import { Card } from "@/components/admin/Card";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { setComplaintAnswered } from "../../actions";

export const metadata: Metadata = { title: "Data complaints" };

type Row = { id: number; at: string; name: string; email: string; order_number: string; message: string; status: string; answered_at: string | null };

/** Data protection complaints from the Contact page form. Acknowledge within 2 working days, answer within 14 days. */
export default async function ComplaintsPage() {
  await requireAdmin();
  const rows = db().prepare("SELECT * FROM data_complaints ORDER BY id DESC LIMIT 500").all() as Row[];
  return (
    <div className="mt-[24px] space-y-[16px]">
      {rows.length === 0 && <p className="text-[15px]">No complaints.</p>}
      {rows.map((r) => {
        const days = Math.floor((Date.now() - Date.parse(r.at)) / 86400000);
        return (
          <Card key={r.id} title={`DC${1000 + r.id} — ${r.status === "open" ? `open, ${days} day(s)` : `answered ${r.answered_at?.slice(0, 10)}`}`}>
            <p>
              {r.at.slice(0, 16).replace("T", " ")} · {r.name} · <a href={`mailto:${r.email}`} className="text-royal underline">{r.email}</a>
              {r.order_number && ` · order ${r.order_number}`}
            </p>
            <p className="mt-[8px] whitespace-pre-wrap text-ink">{r.message}</p>
            <form action={setComplaintAnswered.bind(null, r.id, r.status === "open")} className="mt-[10px]">
              <button type="submit" className="text-[14px] text-royal underline">
                {r.status === "open" ? "Mark as answered" : "Reopen"}
              </button>
            </form>
          </Card>
        );
      })}
    </div>
  );
}
