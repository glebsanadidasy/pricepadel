import type { Facts } from "./facts";
import { UPDATED } from "./facts";
import type { Policy } from "./types";

export const cookies = (f: Facts): Policy => ({
  slug: "cookies",
  title: "Cookie Policy",
  updated: UPDATED,
  summary: "Which cookies this website uses and how to control them.",
  intro: [
    "Cookies are small text files a website stores on your device. This page lists every cookie this website sets and explains your choices, as required by the Privacy and Electronic Communications Regulations (PECR).",
  ],
  sections: [
    {
      id: "summary",
      title: "In short",
      body: [
        "We only use cookies that are **strictly necessary** for the website to work, or that remember a choice you made. We do **not** use analytics, advertising or social media tracking cookies, and we do not let third parties set cookies on our pages.",
      ],
    },
    {
      id: "list",
      title: "Cookies we use",
      body: [
        {
          table: [
            ["Name", "What it does", "How long it lasts", "Type"],
            ["pp_session", "Keeps you signed in to your account", "30 days, or until you sign out", "Strictly necessary"],
            ["pp_cart", "Remembers what is in your cart (product codes and quantities only)", "60 days", "Strictly necessary"],
            ["pp_order_<order number>", "Lets the browser that placed a guest order open that order and pay for it", "90 days", "Strictly necessary"],
            ["currency", "Remembers the currency you chose (£, € or $)", "1 year", "Functional — set only when you choose a currency"],
            ["pp_consent", "Remembers your cookie choice (accept or reject)", "180 days", "Strictly necessary"],
            ["pp_admin", "Keeps our staff signed in to the shop’s admin area (never set for customers)", "12 hours", "Strictly necessary"],
          ],
        },
        "Strictly necessary cookies do not need your consent under PECR, because the website cannot provide what you ask for without them. The currency cookie stores a choice you actively make.",
      ],
    },
    {
      id: "payment",
      title: "The payment page",
      body: [
        "When you pay, you go to our payment provider’s secure page. That page is run by the payment provider, and its own terms and cookie policy apply there. The provider may set its own cookies on that page (for example for security and fraud prevention). We do not control or receive those cookies.",
      ],
    },
    {
      id: "choices",
      title: "Your choices",
      body: [
        "When you first visit, we show a cookie notice with equal **Accept** and **Reject** buttons. Because we currently use no optional cookies, both choices leave the website working the same way. If we ever add optional cookies (such as analytics), we will set them only if you accept, and we will update this page first.",
        "You can change your choice at any time:",
        { component: "cookie-choice" },
        "You can also block or delete cookies in your browser settings. If you block strictly necessary cookies, you will not be able to sign in or use the cart.",
      ],
    },
    {
      id: "more",
      title: "More information",
      body: [
        `See our [Privacy Policy](/policies/privacy) for how we use personal data, or e-mail [${f.email}](mailto:${f.email}). The ICO explains cookies at [ico.org.uk](https://ico.org.uk/for-the-public/online/cookies/).`,
      ],
    },
  ],
});
