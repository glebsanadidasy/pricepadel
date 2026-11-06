import type { Facts } from "./facts";
import { UPDATED } from "./facts";
import type { Policy } from "./types";

export const faq = (f: Facts): Policy => ({
  slug: "faq",
  title: "FAQ",
  updated: UPDATED,
  summary: "Answers to common questions about ordering, delivery, returns and payment.",
  intro: [`Can’t find your answer? E-mail [${f.email}](mailto:${f.email}) or call ${f.phone} (${f.hours}).`],
  sections: [
    {
      id: "ordering",
      title: "Ordering and your account",
      body: [
        "**Do I need an account to shop?** You can browse and fill your cart without one. To place an order you need an account with a confirmed e-mail address — we send you a confirmation link when you register.",
        "**I didn’t get the confirmation e-mail.** Check your spam folder, then sign in and use “Send the link again” on your account page.",
        "**I forgot my password.** Use “Forgot your password?” on the sign-in page. The reset link works once and expires after 1 hour.",
        "**Can I change or cancel my order?** E-mail us as soon as possible with your order number. Before dispatch we can cancel it and refund you in full; after delivery you can use your 14-day right to cancel — see our [Return Policy](/policies/returns).",
        "**When is my order confirmed?** After you pay, we e-mail you that we received your order. We then check availability and e-mail you again to accept it. See section 6 of our [Terms & Conditions](/policies/terms).",
        "**What if an item is not available after I paid?** We tell you by e-mail and refund you in full for that item.",
      ],
    },
    {
      id: "delivery",
      title: "Delivery",
      body: [
        `**Where do you deliver?** At the moment to ${f.countries} only.`,
        `**How much is delivery?** ${f.deliveryPrice} for orders under ${f.freeFrom}; free from ${f.freeFrom}. You see the delivery charge as a separate line before you pay.`,
        "**How long will delivery take?** Usually 7–10 working days after payment. This is an estimate; if your delivery is delayed, we will let you know. See our [Shipping Policy](/policies/shipping).",
        "**Do you deliver to Northern Ireland and the Scottish islands?** Yes. We can’t deliver to the Channel Islands, the Isle of Man, BFPO addresses or PO boxes, or to other European countries for now.",
        "**Will I get a tracking number?** Yes — we e-mail it to you when your order is dispatched.",
        "**Where are orders sent from?** We work with fulfilment partners, and your order may be sent from the European Union, for example from Spain. You never pay anything on delivery: if a carrier asks for import tax or customs charges, contact us and we will pay them.",
        "**My parcel is damaged or missing.** E-mail us with your order number and photos; we will arrange a replacement or refund.",
      ],
    },
    {
      id: "returns",
      title: "Returns and faulty goods",
      body: [
        "**Can I return something if I change my mind?** Yes — tell us within 14 days of delivery and send it back within 14 days after that. Details are in our [Return Policy](/policies/returns).",
        "**Who pays for return postage?** You do if you changed your mind. If an item is faulty or we sent the wrong one, we pay.",
        "**Can I return socks or a mouthguard?** Only unopened. Sports underwear, socks and mouthguards in sealed packaging can’t be returned once unsealed, for hygiene reasons.",
        "**My racket broke — is that a fault?** It depends on the cause. Breaks from impacts with walls, the fence or the floor are not faults. Contact us with photos and we will look at it fairly — see our [Warranty Policy](/policies/warranty).",
      ],
    },
    {
      id: "payment",
      title: "Payment and prices",
      body: [
        "**How can I pay?** By Visa or Mastercard on our payment provider’s secure page. We never see or store your card number.",
        "**Can I pay in euros or dollars?** Yes, when an up-to-date exchange rate is available. You pay exactly the amount shown at checkout; your bank may add its own fees.",
        "**Will I pay anything extra?** No. The price at checkout is final; the only addition is the delivery charge shown before you pay.",
        "**My payment was declined.** You have not been charged. Open the order in your account and choose “Pay now” to try again, or contact your bank.",
      ],
    },
    {
      id: "products",
      title: "Products and sizes",
      body: [
        "**Which sizes are shoes?** EU sizes. Check the brand’s size guide if you are unsure.",
        "**Why can’t I choose some sizes?** Only sizes in stock can be chosen. Stock changes often, so check again later.",
        "**Are the products genuine?** Our products are branded goods sourced from an established European padel supplier. We are not an official or authorised dealer of these brands unless a product page says so.",
      ],
    },
    {
      id: "data",
      title: "Your data and cookies",
      body: [
        "**How do you use my data?** See our [Privacy Policy](/policies/privacy).",
        "**Which cookies do you use?** Only cookies needed for the website to work and to remember your choices — no analytics or advertising cookies. See our [Cookie Policy](/policies/cookies).",
        "**How do I delete my account?** Sign in and open “Delete account”. We confirm by e-mail.",
      ],
    },
  ],
});

export const about = (f: Facts): Policy => ({
  slug: "about",
  title: "About Us",
  updated: UPDATED,
  summary: "Who runs Price Padel.",
  intro: [],
  sections: [
    {
      id: "what",
      title: "What Price Padel is",
      body: [
        "Price Padel is an online shop for padel equipment: rackets, shoes, bags, balls, apparel and accessories for men, women and kids, from the brands players know.",
        "We sell online only and work with fulfilment partners to get your order to you.",
      ],
    },
    {
      id: "who",
      title: "Who runs it",
      body: [
        `Price Padel is a trading name of **${f.company}**, a company registered in England and Wales under number ${f.number}. Registered office: ${f.office}.`,
      ],
    },
    {
      id: "how",
      title: "How we work",
      body: [
        {
          list: [
            "Clear prices: the total before you pay includes the delivery charge, with no hidden fees.",
            "Secure payment: card details go only to our payment provider’s page.",
            "Honest availability: we check availability after your order and refund you in full if we cannot supply an item.",
            "Your rights first: you can cancel within 14 days, and our policies never reduce your legal rights.",
          ],
        },
      ],
    },
    {
      id: "contact",
      title: "Get in touch",
      body: [`[${f.email}](mailto:${f.email}) · ${f.phone} · ${f.hours}. See also our [Contact](/contact) page.`],
    },
  ],
});

export const contact = (f: Facts): Policy => ({
  slug: "contact",
  title: "Contact",
  updated: UPDATED,
  summary: "How to reach Price Padel.",
  intro: [],
  sections: [
    {
      id: "support",
      title: "Orders and support",
      body: [
        `E-mail: [${f.email}](mailto:${f.email})`,
        `Phone: ${f.phone}`,
        `Hours: ${f.hours}. We reply to e-mails within 2 working days.`,
        "Please include your order number if your question is about an order.",
      ],
    },
    {
      id: "partners",
      title: "Partnerships",
      body: ["For brand and business enquiries: [partners@pricepadel.com](mailto:partners@pricepadel.com)."],
    },
    {
      id: "company",
      title: "Company details",
      body: [
        `${f.seller}`,
        `Company number: ${f.number} (registered in England and Wales)`,
        `Registered office: ${f.office}`,
        "The registered office is not a shop or a returns address. Returns go to: Unit 18C, Kingsway Buildings, Kingsway, Bridgend Industrial Estate, Bridgend, CF31 3YH — please read our [Return Policy](/policies/returns) first.",
      ],
    },
    {
      id: "complaints",
      title: "Complaints",
      body: [
        "If something has gone wrong, e-mail us with your order number and what happened. We confirm receipt within 2 working days and give you a full answer within 14 days. Our complaints process is described in section 12 of our [Terms & Conditions](/policies/terms).",
      ],
    },
    {
      id: "data-complaint",
      title: "Data protection complaint form",
      body: [
        "Unhappy with how we use your personal data? Tell us here — no account needed — or e-mail us. We confirm receipt within 2 working days and give a full answer within 14 days. You can also complain to the Information Commissioner’s Office at any time: [ico.org.uk/make-a-complaint](https://ico.org.uk/make-a-complaint/).",
        { component: "data-complaint-form" },
      ],
    },
  ],
});
