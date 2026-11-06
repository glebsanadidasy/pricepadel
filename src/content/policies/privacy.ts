import type { Facts } from "./facts";
import { UPDATED } from "./facts";
import type { Policy } from "./types";

export const privacy = (f: Facts): Policy => ({
  slug: "privacy",
  title: "Privacy Policy",
  updated: UPDATED,
  summary: "What personal data we collect, why, how long we keep it and your rights.",
  intro: [
    "This policy explains how we use your personal data when you visit this website, create an account or buy from us, and what rights you have under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.",
  ],
  sections: [
    {
      id: "controller",
      title: "Who is responsible for your data",
      body: [
        `The controller of your personal data is **${f.company}** (trading as Price Padel), company number ${f.number}, registered office ${f.office}.`,
        `For anything about your data, contact us at [${f.email}](mailto:${f.email}) or ${f.phone}. Our registration number with the Information Commissioner’s Office (ICO): [TBC].`,
      ],
    },
    {
      id: "what",
      title: "What data we collect",
      body: [
        {
          table: [
            ["Data", "Where it comes from"],
            ["Account data: e-mail address, name (optional), password (stored only in scrambled, hashed form), whether your e-mail is confirmed", "You, when you register"],
            ["Addresses and phone number you save for delivery", "You"],
            ["Orders: products, prices, currency and exchange rate, delivery address, order history and status, the time you accepted our terms", "You and our systems"],
            ["Payment information: whether a payment succeeded, was declined or was cancelled, and the amount. **We never see or store your card number**", "Our payment provider"],
            ["Wishlist and cart contents", "You"],
            ["Messages you send us and the e-mails we send you (order confirmations, account e-mails)", "You and us"],
            ["Technical data: your IP address, used to protect sign-in, registration and password reset from abuse", "Your device"],
            ["Cookies — see our [Cookie Policy](/policies/cookies)", "Your device"],
          ],
        },
        "We do not ask for special category data (such as health information), and we do not knowingly collect data from children.",
      ],
    },
    {
      id: "why",
      title: "Why we use your data and our lawful bases",
      body: [
        {
          table: [
            ["Purpose", "Lawful basis"],
            ["Creating and running your account, confirming your e-mail, resetting your password", "Contract — to provide the account you asked for"],
            ["Taking, checking, fulfilling and delivering your orders; handling cancellations, returns, refunds and complaints", "Contract"],
            ["Sending you e-mails about your account and orders (these are service messages, not marketing)", "Contract"],
            ["Keeping order and payment records for accounting and tax", "Legal obligation"],
            ["Protecting the website and your account (limiting repeated sign-in or reset attempts, preventing fraud)", "Legitimate interests — keeping the shop and customers safe"],
            ["Dealing with legal claims", "Legitimate interests"],
          ],
        },
        "We do not send marketing e-mails at the moment. If we start, we will only do so with your consent or, where the law allows, to existing customers with an easy way to opt out in every message.",
        "We do not make decisions about you based solely on automated processing that have legal or similarly significant effects.",
      ],
    },
    {
      id: "sharing",
      title: "Who we share data with",
      body: [
        "We share only what each recipient needs:",
        {
          list: [
            "**Payment provider** — processes your card payment on its own secure page and tells us whether it succeeded.",
            "**E-mail service provider** — sends our account and order e-mails.",
            "**Fulfilment and delivery partners** — receive the items ordered, your name, delivery address and, where needed for delivery, your phone number, so they can pack and deliver your order.",
            "**Hosting and IT service providers** that run this website: [TBC].",
            "**Professional advisers** (such as accountants or lawyers) where needed, and **authorities** such as HMRC or the police where the law requires it.",
          ],
        },
        "These providers act on our instructions or, where they decide how to use data themselves (for example a payment provider meeting its own legal duties), under their own privacy notices. We do not sell your personal data.",
      ],
    },
    {
      id: "transfers",
      title: "Transfers outside the UK",
      body: [
        "Some of our partners are based outside the UK, including in the European Economic Area (EEA), for example fulfilment partners who send orders from the European Union. The UK recognises EEA countries as providing adequate protection for personal data.",
        "If data is transferred to other countries, we will use a safeguard recognised by UK law, such as the UK International Data Transfer Agreement or Addendum. Which providers and countries are involved: [TBC]. You can ask us for details.",
      ],
    },
    {
      id: "retention",
      title: "How long we keep your data",
      body: [
        {
          table: [
            ["Data", "How long"],
            ["Account, addresses and wishlist", "Until you ask us to delete your account, or after [TBC] years without activity"],
            ["Orders and payment records", "As long as tax and company law require: [TBC] years after the end of the financial year of the order"],
            ["Sign-in sessions", "Up to 30 days, or until you sign out"],
            ["Records of sign-in, registration and password reset attempts (with IP address)", "24 hours"],
            ["E-mail confirmation links", "48 hours; password reset links 1 hour (each works once)"],
            ["Messages and complaints", "[TBC]"],
          ],
        },
      ],
    },
    {
      id: "rights",
      title: "Your rights",
      body: [
        "You have the right to:",
        {
          list: [
            "**access** the personal data we hold about you;",
            "have inaccurate data **corrected** (you can edit your name and addresses in your account);",
            "have your data **erased** in some circumstances (you can request deletion from your account);",
            "**restrict** or **object to** our use of your data in some circumstances, including where we rely on legitimate interests;",
            "**data portability** — receive data you gave us in a common format;",
            "**withdraw consent** at any time where we rely on consent.",
          ],
        },
        `To use these rights, e-mail [${f.email}](mailto:${f.email}). We will reply within one month, and we may ask you to confirm your identity. Using your rights is free in most cases.`,
      ],
    },
    {
      id: "complain",
      title: "Complaints to the ICO",
      body: [
        `If you are unhappy with how we use your data, you can complain to us first: e-mail [${f.email}](mailto:${f.email}) with “Data protection complaint” in the subject. We will acknowledge your complaint within 30 days, look into it without undue delay and tell you the outcome. An online complaint form: [TBC].`,
        "You also have the right to complain to the Information Commissioner’s Office: [ico.org.uk/make-a-complaint](https://ico.org.uk/make-a-complaint/), phone 0303 123 1113.",
      ],
    },
    {
      id: "security",
      title: "How we protect your data",
      body: [
        "Passwords are stored only in hashed form, sign-in is protected against repeated guessing, and card details are entered only on the payment provider’s page — never on our website. Access to customer data is limited to people who need it to run the shop.",
        "No website can be completely secure. If a data breach is likely to put your rights at high risk, we will tell you without undue delay.",
      ],
    },
    {
      id: "required",
      title: "What happens if you don’t give us data",
      body: [
        "You can browse the shop and use the cart without giving us any personal data. To create an account we need your e-mail address and a password. To deliver an order we need your name and a delivery address. A phone number and your name in the profile are optional.",
        "If you don’t give us the data we need for an order, we cannot accept or deliver it.",
      ],
    },
    {
      id: "marketing",
      title: "Marketing",
      body: [
        "We do not send marketing e-mails or newsletters at the moment, and we do not use your data for advertising or profiling.",
        "Account and order e-mails (such as e-mail confirmation, password reset, order confirmation and status updates) are service messages. We send them because they are needed to run your account and your orders.",
      ],
    },
    {
      id: "children",
      title: "Children",
      body: [
        "Our website is for adults. Children’s products (for example junior rackets) are bought by adults. We do not knowingly collect personal data from children. If you think a child has given us their data, contact us and we will delete it.",
      ],
    },
    {
      id: "links",
      title: "Other websites",
      body: [
        "Our pages may link to other websites, such as government guidance or the payment provider’s page. Those websites have their own privacy policies, and we are not responsible for how they use your data.",
      ],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      body: ["We will update this page if we change how we use personal data. The date at the top shows when it last changed. If a change is significant, we will tell account holders by e-mail."],
    },
  ],
});
