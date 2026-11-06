/**
 * Policy pages are written as data: numbered sections with simple blocks.
 * Inline text supports **bold** and [link text](/path or https://…). "[TBC]" marks facts the owner still has to give.
 */
export type Block =
  | string
  | { list: string[] }
  | { steps: string[] }
  | { table: string[][] }
  | { note: string }
  | { form: string[] }
  | { component: "cookie-choice" | "data-complaint-form" };

export type PolicySection = { id: string; title: string; body: Block[] };

export type Policy = {
  slug: string;
  title: string;
  /** ISO date of the last change. */
  updated: string;
  summary: string;
  intro: Block[];
  sections: PolicySection[];
};
