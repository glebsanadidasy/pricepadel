import type { Facts } from "./facts";
import { UPDATED } from "./facts";
import type { Policy } from "./types";

export const acceptableUse = (f: Facts): Policy => ({
  slug: "acceptable-use",
  title: "Acceptable Use Policy",
  updated: UPDATED,
  summary: "Rules for using this website and your account.",
  intro: [`This policy sets out how you may use this website, which is run by ${f.seller}. By using the website you agree to it. It sits alongside our [Terms & Conditions](/policies/terms).`],
  sections: [
    {
      id: "allowed",
      title: "Using the website",
      body: ["You may use this website to browse products, manage your account and buy for your own personal use. Please use it lawfully and in a way that does not harm the website, us or other customers."],
    },
    {
      id: "not-allowed",
      title: "What you must not do",
      body: [
        {
          list: [
            "use the website for anything unlawful or fraudulent, including using a card you are not authorised to use;",
            "try to get into accounts, systems or data that are not yours, or test the website for weaknesses without our written permission;",
            "interfere with how the website works, for example by sending large numbers of automated requests or uploading malicious code;",
            "copy large parts of the website, its product data or images by automated means (scraping) or re-publish them;",
            "create accounts with false details or on behalf of someone else without their permission;",
            "abuse or threaten our staff or partners.",
          ],
        },
      ],
    },
    {
      id: "accounts",
      title: "Your account",
      body: [
        "You are responsible for keeping your password safe and for activity on your account. Tell us at once if you think someone else has used it.",
        "We may suspend or close an account that is used in breach of this policy, after telling you why where we are allowed to. This does not affect orders already accepted or your legal rights.",
      ],
    },
    {
      id: "content",
      title: "Our content",
      body: [
        "The website’s design, text and our own graphics belong to us or are used with permission. Product names, logos and product photos belong to their owners (usually the brands). You may view and print pages for your own use; any other use needs permission.",
      ],
    },
    {
      id: "links",
      title: "Links to other websites",
      body: ["Where we link to other websites (for example government guidance), we do so for your information. We are not responsible for their content."],
    },
    {
      id: "report",
      title: "Reporting a problem",
      body: [`If you notice a security problem or misuse of the website, please tell us at [${f.email}](mailto:${f.email}).`],
    },
  ],
});
