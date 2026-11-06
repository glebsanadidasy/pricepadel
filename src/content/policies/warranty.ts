import type { Facts } from "./facts";
import { UPDATED } from "./facts";
import type { Policy } from "./types";

export const warranty = (f: Facts): Policy => ({
  slug: "warranty",
  title: "Warranty Policy",
  updated: UPDATED,
  summary: "Your legal rights for faulty goods, and how manufacturer warranties fit alongside them.",
  intro: [
    "We do not offer an extra guarantee of our own. You are protected by your legal rights, and some products also come with a manufacturer’s warranty. This page explains both.",
  ],
  sections: [
    {
      id: "legal",
      title: "Your legal rights",
      body: [
        "Under the Consumer Rights Act 2015, goods you buy from us must be of satisfactory quality, fit for purpose and as described. If they are not, you are entitled to a remedy from us — the seller — whatever any manufacturer warranty says:",
        {
          list: [
            "within 30 days of delivery: a full refund;",
            "within 6 months: a repair or replacement, or if that is not possible or does not work, a refund;",
            "up to 6 years: if the goods do not last a reasonable time, you may be entitled to some money back.",
          ],
        },
        "Full details are in our [Return Policy](/policies/returns). Citizens Advice also explains these rights: [citizensadvice.org.uk](https://www.citizensadvice.org.uk/consumer/).",
      ],
    },
    {
      id: "manufacturer",
      title: "Manufacturer warranties",
      body: [
        "A manufacturer’s warranty applies only if the manufacturer gives one for that product. Its terms are in the documents that come with the product or are available from the manufacturer.",
        "You can always contact us about a problem instead of the manufacturer. A manufacturer warranty is **in addition** to your legal rights; your legal rights against us do not depend on it.",
      ],
    },
    {
      id: "not-faults",
      title: "What is not a fault",
      body: [
        "Your legal rights cover faults, not normal wear and tear. For example, the following are not faults:",
        {
          list: [
            "wear of soles, grips, overgrips and fabrics from normal use;",
            "a racket cracked or broken by hitting a wall, the fence, the floor or another racket;",
            "damage from leaving products in heat (for example in a car), from water, or from using them for something they are not designed for;",
            "balls losing pressure over time after the tube has been opened.",
          ],
        },
        "If you are unsure whether something is a fault, contact us and we will look at it fairly.",
      ],
    },
    {
      id: "claim",
      title: "How to report a problem",
      body: [
        {
          steps: [
            `E-mail [${f.email}](mailto:${f.email}) with your order number, the product and a short description of the problem.`,
            "Attach clear photos (and a short video if the problem is easier to show that way).",
            "We reply with the next steps. If we need the product back, we tell you how to return it and we pay the reasonable cost of returning faulty goods.",
          ],
        },
        "Sometimes we may need to send the product to the manufacturer to be inspected. We will keep you updated, and this does not reduce your legal rights.",
      ],
    },
  ],
});
