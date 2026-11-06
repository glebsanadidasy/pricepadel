import type { Facts } from "./facts";
import { UPDATED } from "./facts";
import type { Policy } from "./types";

export const shipping = (f: Facts): Policy => ({
  slug: "shipping",
  title: "Shipping Policy",
  updated: UPDATED,
  summary: "Where we deliver, what delivery costs and how dispatch works.",
  intro: [
    "This page explains where we deliver, what it costs and what happens between your order and its arrival. It forms part of our [Terms & Conditions](/policies/terms).",
  ],
  sections: [
    {
      id: "where",
      title: "Where we deliver",
      body: [
        `We currently deliver to addresses in **${f.countries}** only. At checkout you can only choose a delivery address in a country we deliver to.`,
        "This includes Northern Ireland, the Scottish Highlands and the Scottish islands.",
        "We cannot deliver to the Channel Islands (Jersey, Guernsey and their islands), the Isle of Man, BFPO addresses or PO boxes. Checkout will tell you if your address is one of these.",
        "We cannot take orders for delivery to other European countries at the moment.",
      ],
    },
    {
      id: "cost",
      title: "Delivery charges",
      body: [
        {
          table: [
            ["Order value (products)", "Delivery charge"],
            [`Under ${f.freeFrom}`, f.deliveryPrice],
            [`${f.freeFrom} or more`, "Free"],
          ],
        },
        "The delivery charge is worked out from the value of the products in your cart and is shown as a separate line in your cart and at checkout before you pay. Amounts here are in pounds sterling; the delivery charge is converted at the same rate as the products and shown in the currency you pay in.",
        "If you cancel an order or send goods back under your 14-day right to cancel, we refund the delivery charge you paid for the standard delivery option.",
      ],
    },
    {
      id: "process",
      title: "From order to dispatch",
      body: [
        {
          steps: [
            "You pay at checkout and we e-mail you to confirm that we have received your order.",
            "We check that every item is available with our fulfilment partners.",
            "We e-mail you to accept your order. If an item is not available, we tell you and refund you for it.",
            "Your order is dispatched and we e-mail you to let you know.",
          ],
        },
        "When your order is dispatched, we e-mail you the tracking number.",
      ],
    },
    {
      id: "times",
      title: "Delivery times",
      body: [
        "Delivery usually takes **7–10 working days after payment**. This is an estimate, not a guaranteed date. If your delivery is delayed, we will let you know.",
        "Unless we agree a different date with you, we deliver without undue delay and no later than 30 days after we accept your order. If we cannot deliver within that time, we will tell you, and you may cancel and get a full refund.",
      ],
    },
    {
      id: "from",
      title: "Where orders are sent from",
      body: [
        "We work with fulfilment partners. Your order may be sent from outside the UK, including from the European Union (for example from Spain).",
        "**You do not pay anything on delivery.** The price at checkout is final. If a carrier asks you for import VAT, customs duty or a handling fee, please don’t pay it — contact us and we will cover these costs.",
      ],
    },
    {
      id: "receiving",
      title: "Receiving your order",
      body: [
        "Please check that your delivery address is complete and correct, including the postcode. If it is wrong, delivery can be delayed or fail.",
        "If nobody is in, the carrier usually tries again the next working day. Where the carrier allows it, you can choose to have the parcel delivered to a nearby address or collection point instead. If a parcel is returned to us, we will contact you to arrange what happens next.",
        "The goods are your responsibility once they are delivered to you or to someone you nominate.",
      ],
    },
    {
      id: "problems",
      title: "Damaged, missing or late parcels",
      body: [
        `If your parcel arrives damaged, has something missing or has not arrived when expected, please e-mail [${f.email}](mailto:${f.email}) with your order number (and photos of any damage). Please keep the packaging until we have replied.`,
        "Goods that arrive damaged or are lost before they reach you are our responsibility. We will arrange a replacement or a refund, as you prefer.",
      ],
    },
  ],
});
