import type { Facts } from "./facts";
import { UPDATED } from "./facts";
import type { Policy } from "./types";

export const returns = (f: Facts): Policy => ({
  slug: "returns",
  title: "Return Policy",
  updated: UPDATED,
  summary: "How to cancel an order, return goods and get your money back, and what to do about faulty goods.",
  intro: [
    "You can change your mind about an online order, and you have extra rights if goods are faulty. This page explains both. It forms part of our [Terms & Conditions](/policies/terms) and does not limit your legal rights.",
  ],
  sections: [
    {
      id: "summary",
      title: "Quick summary",
      body: [
        {
          table: [
            ["", "Changed your mind", "Faulty or not as described"],
            ["How long", "14 days after delivery to tell us, then 14 days to send the goods back", "Contact us as soon as you notice; see section 7 for time limits"],
            ["Return postage", "You pay", "We pay"],
            ["What you get back", "Price of the goods + standard delivery charge", "Refund, repair or replacement depending on timing"],
            ["Refund time", "Within 14 days of us receiving the goods back (or proof of posting)", "Without undue delay, within 14 days of agreeing a refund"],
          ],
        },
      ],
    },
    {
      id: "before-dispatch",
      title: "Cancelling before your order is sent",
      body: [
        `If you change your mind before your order is dispatched, e-mail [${f.email}](mailto:${f.email}) with your order number. We will cancel it and refund everything you paid, including the delivery charge, within 14 days.`,
        "If your order has already been passed to our fulfilment partner, we will try to stop it. If it has already left, you can still cancel by returning it (see below).",
      ],
    },
    {
      id: "fourteen-days",
      title: "Your 14-day right to cancel",
      body: [
        "You can cancel your order for any reason up to **14 days after the day you receive your goods**. If your order is delivered in more than one parcel, the 14 days start the day after you receive the last one.",
        "To cancel, tell us clearly within those 14 days. You can:",
        {
          list: [
            `e-mail [${f.email}](mailto:${f.email}) with your name, order number and the items you are returning; or`,
            "fill in and e-mail us the model cancellation form below (you don’t have to use it).",
          ],
        },
        "We will confirm by e-mail that we have received your cancellation.",
      ],
    },
    {
      id: "form",
      title: "Model cancellation form",
      body: [
        "Complete and return this form only if you wish to cancel the contract:",
        {
          form: [
            `To: ${f.seller}, ${f.office}`,
            `E-mail: ${f.email}`,
            "",
            "I/We (*) hereby give notice that I/We (*) cancel my/our (*) contract of sale of the following goods (*):",
            "_______________________________________________",
            "Ordered on (*) / received on (*): ___________",
            "Order number: ___________",
            "Name of consumer(s): ___________",
            "Address of consumer(s): ___________",
            "Signature of consumer(s) (only if this form is notified on paper): ___________",
            "Date: ___________",
            "",
            "(*) Delete as appropriate.",
          ],
        },
      ],
    },
    {
      id: "send-back",
      title: "Sending goods back",
      body: [
        "Please send the goods back **within 14 days of telling us you are cancelling**.",
        "Return address: **Price Padel Returns, Unit 18C, Kingsway Buildings, Kingsway, Bridgend Industrial Estate, Bridgend, CF31 3YH**. Please don’t send returns to our registered office.",
        "If you have changed your mind, you pay for the return postage. If the goods are faulty or we sent you the wrong item, we pay for the return.",
        "Pack the goods carefully, include your order number, and keep proof of postage. We recommend a tracked service, because goods are your responsibility until they reach us.",
        "You can handle the goods as you would in a shop to check them (for example, try shoes on indoors on a clean surface). If they have been used beyond that — for example a racket used for play or shoes worn outdoors — we may reduce your refund to reflect the loss in value.",
        "Goods supplied in sealed packaging that are not suitable for return for health protection or hygiene reasons cannot be returned once unsealed: **sports underwear, socks and mouthguards**. You can still return them unopened, and your rights for faulty goods always apply.",
      ],
    },
    {
      id: "refunds",
      title: "Refunds",
      body: [
        {
          list: [
            "We refund the price of the goods and the standard delivery charge you paid.",
            "We refund within 14 days of receiving the goods back, or of you giving us proof that you sent them, whichever is earlier. If you cancel before dispatch, we refund within 14 days of you telling us.",
            "Refunds go back to the card you paid with, in the currency you paid in. We do not charge a fee for refunds. Your bank decides how quickly the money appears, and exchange rates may have changed if you paid in euros or US dollars.",
          ],
        },
      ],
    },
    {
      id: "faulty",
      title: "Faulty goods or goods not as described",
      body: [
        "This is separate from your right to change your mind. Under the Consumer Rights Act 2015 goods must be of satisfactory quality, fit for purpose and as described.",
        {
          list: [
            "**Within 30 days of delivery** you can reject faulty goods and get a full refund.",
            "**After 30 days and within 6 months** you can ask for a repair or replacement. If that is not possible or does not fix the problem, you can have a price reduction or a refund (a deduction for use may apply after the first 6 months only).",
            "**After 6 months** you still have rights, but you may need to show the fault was there at delivery.",
          ],
        },
        `Please e-mail [${f.email}](mailto:${f.email}) with your order number, a description of the problem and photos. We will tell you how to return the item; we pay the cost of returning faulty goods or a wrong item we sent. Normal wear and tear, accidental damage and damage from misuse (for example, a racket hitting the wall or the floor) are not faults.`,
        "Manufacturer warranties, where offered, are explained in our [Warranty Policy](/policies/warranty). They are in addition to these rights.",
      ],
    },
    {
      id: "contact",
      title: "Questions",
      body: [`If you are not sure whether something can be returned, ask us first: [${f.email}](mailto:${f.email}), ${f.phone} (${f.hours}).`],
    },
  ],
});
