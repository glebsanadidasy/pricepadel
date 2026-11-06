import "server-only";
import { readSettings } from "@/lib/catalog-store";
import { acceptableUse } from "./acceptable-use";
import { cookies } from "./cookies";
import { disclaimer } from "./disclaimer";
import { facts } from "./facts";
import { about, contact, faq } from "./pages";
import { payment } from "./payment";
import { privacy } from "./privacy";
import { returns } from "./returns";
import { shipping } from "./shipping";
import { terms } from "./terms";
import { warranty } from "./warranty";
import type { Policy } from "./types";

const BUILDERS = { terms, privacy, cookies, shipping, returns, payment, warranty, "acceptable-use": acceptableUse, disclaimer, faq, about, contact } as const;

/** A policy page with today's delivery terms and FX margin from the admin settings. */
export function getPolicy(slug: string): Policy | undefined {
  const s = readSettings();
  const f = facts({ ...s.delivery.customer, countries: s.delivery.countries }, s.fx.marginPct);
  const build = BUILDERS[slug as keyof typeof BUILDERS];
  return build ? build(f) : undefined;
}
