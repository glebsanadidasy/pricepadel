import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { CookieChoiceButtons } from "@/components/consent/CookieBanner";
import { DataComplaintForm } from "@/components/contact/DataComplaintForm";
import type { Block, Policy } from "@/content/policies/types";

/** **bold**, [text](href) and highlighted [TBC] placeholders. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\[TBC[^\]]*\])/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**")) return <strong key={i} className="font-bold text-ink">{p.slice(2, -2)}</strong>;
        if (p.startsWith("[TBC")) return <mark key={i} className="bg-[#fff3c4] px-[2px] text-ink">{p}</mark>;
        const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (m) {
          const external = /^https?:/.test(m[2]);
          return external ? (
            <a key={i} href={m[2]} target="_blank" rel="noreferrer noopener" className="text-royal underline">
              {m[1]}
            </a>
          ) : (
            <Link key={i} href={m[2]} className="text-royal underline">
              {m[1]}
            </Link>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function BlockView({ b }: { b: Block }) {
  if (typeof b === "string") return <p><Inline text={b} /></p>;
  if ("list" in b) return <ul className="list-disc space-y-[6px] pl-[22px]">{b.list.map((t, i) => <li key={i}><Inline text={t} /></li>)}</ul>;
  if ("steps" in b) return <ol className="list-decimal space-y-[6px] pl-[22px]">{b.steps.map((t, i) => <li key={i}><Inline text={t} /></li>)}</ol>;
  if ("note" in b) return <p className="border-l-4 border-lime bg-[#f7fbe5] px-[16px] py-[10px]"><Inline text={b.note} /></p>;
  if ("form" in b)
    return (
      <div className="whitespace-pre-wrap break-words border border-dashed border-line bg-[#fafafa] p-[12px] font-mono text-[12px] leading-[20px] text-ink [overflow-wrap:anywhere] sm:p-[16px] sm:text-[13px]">
        {b.form.join("\n")}
      </div>
    );
  if ("table" in b)
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b-2 border-ink text-ink">{b.table[0].map((h, i) => <th key={i} className="py-[6px] pr-[12px]">{h}</th>)}</tr>
          </thead>
          <tbody>
            {b.table.slice(1).map((row, r) => (
              <tr key={r} className="border-b border-line align-top">{row.map((c, i) => <td key={i} className="py-[8px] pr-[12px]"><Inline text={c} /></td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  if (b.component === "cookie-choice") return <CookieChoiceButtons />;
  if (b.component === "data-complaint-form") return <DataComplaintForm />;
  return null;
}

const longDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** A long policy page: title band, last-updated date, table of contents, numbered sections. */
export function PolicyView({ policy, crumbs, children }: { policy: Policy; crumbs: { href: string; label: string }[]; children?: React.ReactNode }) {
  return (
    <>
      <PageHero title={policy.title} crumbs={crumbs} />
      <div className="mx-auto grid max-w-site gap-[36px] px-[15px] pb-[80px] pt-[36px] lg:grid-cols-[260px_1fr] lg:px-0">
        <nav aria-label="Contents" className="text-[14px] lg:sticky lg:top-[20px] lg:self-start">
          <p className="font-bold uppercase tracking-[1px] text-ink">Contents</p>
          <ol className="mt-[10px] space-y-[6px]">
            {policy.sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-royal hover:underline">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="min-w-0 max-w-[820px] space-y-[16px] text-[16px] leading-[26px] text-body">
          <p className="text-[14px] text-[#888]">Last updated: {longDate(policy.updated)}</p>
          {policy.intro.map((b, i) => <BlockView key={i} b={b} />)}
          {policy.sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-[20px] space-y-[12px] pt-[14px]">
              <h2 className="text-[22px] font-bold leading-[28px] text-ink">
                {i + 1}. {s.title}
              </h2>
              {s.body.map((b, j) => <BlockView key={j} b={b} />)}
            </section>
          ))}
          {children}
        </article>
      </div>
    </>
  );
}
