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
        "Whether we deliver to the Channel Islands, the Isle of Man, Scottish Highlands and islands, Northern Ireland, BFPO addresses and PO boxes: [TBC].",
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
        "The delivery charge is worked out from the value of the products in your cart and is shown as a separate line in your cart and at checkout before you pay. If you pay in euros or US dollars, the charge is converted at the same rate as the products.",
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
        "Tracking information: [TBC].",
      ],
    },
    {
      id: "times",
      title: "Delivery times",
      body: [
        "Estimated delivery times: [TBC]. We will not promise a delivery date we cannot keep.",
        "Unless we agree a different date with you, we deliver without undue delay and no later than 30 days after we accept your order. If we cannot deliver within that time, we will tell you, and you may cancel and get a full refund.",
      ],
    },
    {
      id: "from",
      title: "Where orders are sent from",
      body: [
        "We work with fulfilment partners. Your order may be sent from outside the UK, including from a country in the European Union.",
        "Import VAT, customs duties and any handling fees for orders sent from outside the UK: [TBC]. We will make sure the total you see at checkout includes everything you have to pay to us; how any import charges are handled will be explained here before we take orders that could be subject to them.",
      ],
    },
    {
      id: "receiving",
      title: "Receiving your order",
      body: [
        "Please check that your delivery address is complete and correct, including the postcode. If it is wrong, delivery can be delayed or fail.",
        "What happens if nobody is in when the carrier calls: [TBC] (this depends on the carrier).",
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
