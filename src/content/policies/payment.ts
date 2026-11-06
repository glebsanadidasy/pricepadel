import type { Facts } from "./facts";
import { UPDATED } from "./facts";
import type { Policy } from "./types";

export const payment = (f: Facts): Policy => ({
  slug: "payment",
  title: "Payment Policy",
  updated: UPDATED,
  summary: "How you pay, currencies, when your card is charged and how refunds work.",
  intro: ["This page explains how payment works on Price Padel. It forms part of our [Terms & Conditions](/policies/terms)."],
  sections: [
    {
      id: "methods",
      title: "How you can pay",
      body: [
        "We accept **Visa** and **Mastercard** cards.",
        "You enter your card details only on our payment provider’s secure page, which opens when you click “Pay by Wallet” at checkout. **Card details are never entered on our website, and we never see or store your card number.** We only receive the result of the payment (paid, declined or cancelled) and the amount.",
        "Other payment methods: we do not offer any at the moment.",
      ],
    },
    {
      id: "when",
      title: "When your card is charged",
      body: [
        "Your card is charged when you complete payment on the payment provider’s page. Your order is marked as paid only when the payment provider confirms the payment to us directly.",
        "After payment we check availability and then e-mail you to accept your order (see section 6 of our [Terms & Conditions](/policies/terms)). If we cannot supply an item, we refund what you paid for it.",
        "If your payment is declined or you cancel on the payment page, you are not charged. Your order stays in your account as “Awaiting payment”, and you can try again from there.",
      ],
    },
    {
      id: "currencies",
      title: "Currencies and exchange rates",
      body: [
        `Our prices are set in pounds sterling (£). They are shown and charged in ${f.currencyNames}.`,
        `To convert them we use the European Central Bank’s daily reference rate plus a margin (currently ${f.fxMargin}), or a rate we set manually. The rate in use is applied to every price you see, and **you are charged exactly the amount shown at checkout**.`,
        "If we do not have an up-to-date exchange rate (older than 3 days), we show and charge prices in pounds sterling until a new rate is available.",
        "Your bank or card issuer may charge its own fees for payments in a foreign currency. We do not control or receive these fees.",
      ],
    },
    {
      id: "total",
      title: "What the total includes",
      body: [
        `The total at checkout includes the price of the products and the delivery charge (${f.deliveryPrice} for orders under ${f.freeFrom}, free from ${f.freeFrom}). This is the final price: we do not add any other taxes or fees. You pay nothing on delivery — if a carrier asks for import tax or customs charges, contact us and we will cover them (see our [Shipping Policy](/policies/shipping)).`,
      ],
    },
    {
      id: "refunds",
      title: "Refunds",
      body: [
        "Refunds go back to the card you paid with, in the currency you paid in. We do not charge a fee for refunds. How quickly the money appears depends on your bank. If you paid in euros or dollars, the amount in your own currency can differ because exchange rates change.",
        "Our [Returns Policy](/policies/returns) explains when refunds are due.",
      ],
    },
    {
      id: "security",
      title: "Security and fraud",
      body: [
        "Your payment is handled by our payment provider, which is responsible for keeping card data secure. Your bank may ask you to confirm the payment (for example in your banking app).",
        `If you see a payment from us that you do not recognise, contact us straight away at [${f.email}](mailto:${f.email}) and your card issuer.`,
      ],
    },
  ],
});
