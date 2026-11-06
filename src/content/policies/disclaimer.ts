import type { Facts } from "./facts";
import { UPDATED } from "./facts";
import type { Policy } from "./types";

export const disclaimer = (f: Facts): Policy => ({
  slug: "disclaimer",
  title: "Disclaimer",
  updated: UPDATED,
  summary: "About the information on this website.",
  intro: ["We work to keep this website accurate and up to date. This page explains the limits of the information on it. It does not affect your legal rights as a consumer."],
  sections: [
    {
      id: "products",
      title: "Product information",
      body: [
        "Product descriptions, specifications and photos are based on information from manufacturers. Manufacturers sometimes change products, packaging or specifications without notice, and colours can look different on different screens.",
        "If a product you receive does not match its description in a way that matters, you have rights under the Consumer Rights Act 2015 — see our [Return Policy](/policies/returns).",
      ],
    },
    {
      id: "advice",
      title: "Not professional advice",
      body: [
        "Information on this website — for example about racket weight, balance or shoe soles — is general product information, not personal, medical or coaching advice. If you have an injury or a health condition, please ask a qualified professional before choosing equipment.",
      ],
    },
    {
      id: "availability",
      title: "Availability of the website",
      body: [
        "We try to keep the website running, but we cannot promise it will always be available or free of errors. We may suspend it for maintenance or updates.",
      ],
    },
    {
      id: "brands",
      title: "Brands and trade marks",
      body: [
        "Brand names, logos and trade marks shown on this website belong to their owners. Showing them does not mean that a brand endorses or sponsors Price Padel, or that we are an authorised or official dealer of that brand unless we expressly say so.",
      ],
    },
    {
      id: "liability",
      title: "Our responsibility",
      body: [
        "Our responsibility to customers who buy from us is set out in section 11 of our [Terms & Conditions](/policies/terms). Nothing on this page limits liability that cannot be limited by law.",
        `Questions: [${f.email}](mailto:${f.email}).`,
      ],
    },
  ],
});
