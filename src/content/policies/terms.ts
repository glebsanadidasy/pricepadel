import type { Facts } from "./facts";
import { UPDATED } from "./facts";
import type { Policy } from "./types";

export const terms = (f: Facts): Policy => ({
  slug: "terms",
  title: "Terms & Conditions",
  updated: UPDATED,
  summary: "The terms of sale between you and Price Padel when you buy from this website.",
  intro: [
    "These terms explain how buying from Price Padel works: who we are, how an order becomes a contract, prices, delivery, cancelling, faulty goods and what to do if something goes wrong. Please read them before you order. When you place an order you will be asked to confirm that you accept them.",
    { note: "**Your legal rights.** Nothing in these terms takes away or limits the rights you have as a consumer under UK law, including the Consumer Rights Act 2015 and the Consumer Contracts Regulations 2013. If anything here seems to conflict with those rights, your legal rights apply." },
  ],
  sections: [
    {
      id: "who-we-are",
      title: "Who we are and how to contact us",
      body: [
        `This website is run by **${f.seller}**. ${f.company} is a company registered in England and Wales under company number **${f.number}**. Our registered office is ${f.office}.`,
        `You can contact us by e-mail at [${f.email}](mailto:${f.email}) or by phone on ${f.phone} (${f.hours}).`,
        "When we write to you, we will use the e-mail address you gave when you created your account or placed your order.",
      ],
    },
    {
      id: "these-terms",
      title: "These terms",
      body: [
        "These terms apply to every order placed on this website. They are only in English.",
        "We may update these terms from time to time, for example when the law changes. The version that applies to your order is the one shown on the website when you placed it. We keep a copy, and you can ask us for it.",
        "These terms are for consumers buying for personal use. If you buy for a business, please contact us first.",
      ],
    },
    {
      id: "account",
      title: "Your account",
      body: [
        "You can browse the shop and fill your cart without an account. To place an order you need an account with a confirmed e-mail address: we send you a link when you register.",
        "You must be at least 18 years old to create an account and place an order.",
        "Please keep your password private and tell us straight away if you think someone else has used your account. You can change your password at any time with the “Forgot your password?” link.",
        "You can ask us to delete your account from the “Delete account” page in your account. We keep records of orders for as long as the law requires — see our [Privacy Policy](/policies/privacy).",
      ],
    },
    {
      id: "products",
      title: "Our products",
      body: [
        "We sell padel equipment: rackets, shoes, bags, balls, apparel and accessories. Product pages show the brand, the main features and the options (such as colour and size) that are available to order.",
        "Product descriptions and specifications are based on information from the manufacturers. Photos are for illustration: colours can look slightly different on different screens, and packaging can change.",
        "Shoe sizes are shown in EU sizes. Please check the manufacturer’s size guide before ordering if you are not sure.",
        "Only options that are shown as available can be ordered, but stock can change quickly. Availability is confirmed after your order — see section 6.",
      ],
    },
    {
      id: "prices",
      title: "Prices, delivery charges and pricing errors",
      body: [
        "Prices are shown in pounds sterling (£). If you choose euros or US dollars, we convert our prices using the exchange rate shown on the website, and you pay exactly the amount shown at checkout. Your bank may charge its own fees.",
        "The price you see at checkout is the final price. No taxes or charges are added on top, apart from the delivery charge shown.",
        `Delivery costs ${f.deliveryPrice} for orders under ${f.freeFrom} and is free for orders of ${f.freeFrom} or more. The delivery charge is shown as a separate line in your cart and at checkout, and the total you see before you pay includes every charge you have to pay to us. There are no other fees from us.`,
        "You do not pay anything when your order is delivered. Some orders are sent from the European Union; if a carrier ever asks you for import tax or customs charges, contact us and we will pay them. See our [Shipping Policy](/policies/shipping).",
        "We check prices carefully, but mistakes can happen. If we find that a price was clearly wrong (for example, a price that is obviously far too low), we will tell you before we accept your order and you can choose to order at the correct price or cancel. If you cancel, we refund what you paid in full.",
      ],
    },
    {
      id: "contract",
      title: "How a contract is made",
      body: [
        "Ordering works like this:",
        {
          steps: [
            "You add products to your cart and go to checkout. You can review and change your cart, delivery address and currency at any time before you pay. If you notice a mistake, go back and correct it.",
            "At checkout you see the full price, the delivery charge and the total, and you tick a box to accept these terms.",
            "You pay by card on our payment provider’s secure page. Your card is charged when you pay.",
            "We e-mail you to confirm that we have received your order and payment. **This e-mail is not yet our acceptance of your order.**",
            "We then check that every item is available with our fulfilment partners.",
            "**The contract between you and us is made when we e-mail you to say that we have accepted your order.**",
          ],
        },
        "If an item is not available, we will tell you by e-mail and cancel the order for that item (or the whole order, if you prefer). We refund the amount you paid for anything we cannot supply, including the delivery charge if no items are sent, as soon as possible and no later than 14 days after telling you.",
        "We may also refuse an order, for example if the price was clearly wrong (see section 5) or we cannot deliver to your address. If we do, we refund you in full.",
        "We accept or decline your order within 2 working days of payment. If we have not done so by then, you can ask us to cancel it and we will refund you in full.",
      ],
    },
    {
      id: "delivery",
      title: "Delivery",
      body: [
        `We currently deliver to addresses in ${f.countries} only. Delivery charges and timescales are explained in our [Shipping Policy](/policies/shipping).`,
        "Unless we agree a different date with you, we will deliver your order without undue delay and no later than 30 days after the contract is made. If we cannot, we will contact you, and you may have the right to cancel and get a full refund.",
        "The goods are your responsibility from the time they are delivered to you or to someone you nominate. You own the goods once we have received full payment.",
      ],
    },
    {
      id: "cancel",
      title: "Your right to cancel (14 days)",
      body: [
        "Because you buy online, you have a legal right to change your mind and cancel. You do not need to give a reason.",
        {
          list: [
            "You can cancel at any time from placing your order until **14 days after the day you (or someone you nominate) receive the goods**. If your order arrives in separate deliveries, the 14 days run from the day you receive the last item.",
            "To cancel, tell us clearly — for example by e-mail to " + f.email + " or by using the model cancellation form in our [Returns Policy](/policies/returns).",
            "Send the goods back within 14 days of telling us, to our returns address in our [Returns Policy](/policies/returns). If you have simply changed your mind, you pay for the return postage.",
            "We refund the price you paid and the standard delivery charge within 14 days of receiving the goods back, or of you showing us proof that you sent them back, whichever is earlier. If you cancel before the goods are sent, we refund you within 14 days of you telling us.",
            "We refund using the same card you paid with.",
          ],
        },
        "You can handle the goods as you would in a shop to check them, but please do not use them (for example, do not play with a racket or wear shoes outdoors). If the goods have lost value because they were handled more than that, we may reduce your refund by that amount.",
        "Goods supplied in sealed packaging that are not suitable for return for health protection or hygiene reasons cannot be returned once unsealed: sports underwear, socks and mouthguards.",
      ],
    },
    {
      id: "faulty",
      title: "If something is wrong with your goods",
      body: [
        "We have a legal duty to supply goods that are of satisfactory quality, fit for their purpose and as described. This is a summary of your key rights under the Consumer Rights Act 2015:",
        {
          list: [
            "**Up to 30 days:** if your goods are faulty, you can reject them and get an immediate refund.",
            "**Up to 6 months:** if a fault can’t be repaired or the goods replaced, you are entitled to a full refund in most cases. A fault that shows within 6 months of delivery is presumed to have been there at delivery unless we prove otherwise.",
            "**Up to 6 years:** if the goods do not last a reasonable length of time, you may be entitled to some money back.",
          ],
        },
        "For more information visit [Citizens Advice](https://www.citizensadvice.org.uk/consumer/) or call the Citizens Advice consumer helpline on 0808 223 1133.",
        "Please contact us as soon as you notice a problem, with your order number and photos if possible. We pay the reasonable cost of returning faulty goods. Our [Warranty Policy](/policies/warranty) explains how manufacturer warranties work alongside these rights.",
      ],
    },
    {
      id: "our-cancellation",
      title: "If we have to cancel",
      body: [
        "We may have to cancel an order before the goods are sent, for example if an item turns out not to be available or because of events outside our control. If we do, we will tell you promptly and refund you in full for anything not supplied.",
        "If events outside our control (such as a strike or a carrier failure) delay delivery, we will tell you and try to keep the delay short. If the delay is long, you can cancel and get a refund for goods you have paid for but not received.",
      ],
    },
    {
      id: "liability",
      title: "Our responsibility for loss or damage",
      body: [
        "If we break these terms or fail to use reasonable care and skill, we are responsible for loss or damage you suffer that is a foreseeable result. Loss or damage is foreseeable if it is obvious that it would happen, or if both of us knew it might happen when the contract was made.",
        "We supply goods for personal use only. We are not responsible for loss of profit, loss of business or business interruption.",
        "We do not exclude or limit our liability where it would be unlawful to do so. This includes liability for death or personal injury caused by our negligence, for fraud or fraudulent misrepresentation, for breach of your legal rights in relation to the goods (see section 9), and for defective products under the Consumer Protection Act 1987.",
      ],
    },
    {
      id: "complaints",
      title: "Complaints",
      body: [
        `If you are unhappy with anything, please contact us at [${f.email}](mailto:${f.email}) or on ${f.phone}, with your order number. We confirm that we have received your complaint within 2 working days and give you a full answer within 14 days.`,
        "We will look into your complaint, tell you what we found and what we will do. We are not obliged to use an alternative dispute resolution (ADR) scheme and we do not take part in one.",
        "You can also get free advice from Citizens Advice, and you keep your right to go to court (see section 13).",
      ],
    },
    {
      id: "law",
      title: "Law and courts",
      body: [
        "These terms are governed by the law of England and Wales. You can bring legal proceedings in the courts of England and Wales. If you live in Scotland you can also bring proceedings in Scotland, and if you live in Northern Ireland you can also bring proceedings in Northern Ireland.",
        "If a court decides that part of these terms is unenforceable, the rest stays in force.",
        "A delay by us in enforcing these terms does not mean we give up our rights.",
      ],
    },
    {
      id: "other-documents",
      title: "Other documents that apply",
      body: [
        "These terms work together with our [Shipping Policy](/policies/shipping), [Returns Policy](/policies/returns), [Payment Policy](/policies/payment), [Warranty Policy](/policies/warranty), [Privacy Policy](/policies/privacy), [Cookie Policy](/policies/cookies), [Acceptable Use Policy](/policies/acceptable-use) and [Disclaimer](/policies/disclaimer).",
      ],
    },
  ],
});
