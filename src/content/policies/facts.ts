import { BUSINESS } from "@/config/site";

/** Facts every policy uses. Delivery terms come from the admin settings, so the texts always match the checkout. */
export type Facts = {
  seller: string;
  company: string;
  number: string;
  office: string;
  email: string;
  phone: string;
  hours: string;
  deliveryPrice: string;
  freeFrom: string;
  countries: string;
  fxMargin: string;
  /** How prices are shown and charged, in words — follows the currencies chosen in the admin panel. */
  currencyText: string;
  /** e.g. "euros (€)", "euros (€) or pounds sterling (£)" */
  currencyNames: string;
};

const NAMES = { GBP: "pounds sterling (£)", EUR: "euros (€)", USD: "US dollars ($)" } as const;

export function facts(delivery: { price: number; freeFrom: number; countries: string[] }, fxMarginPct: number, currencies: ("GBP" | "EUR" | "USD")[] = ["GBP"]): Facts {
  const names = currencies.map((c) => NAMES[c]);
  const currencyNames = names.length > 1 ? `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}` : names[0];
  const onlyForeign = !currencies.includes("GBP");
  const currencyText = onlyForeign
    ? `Prices are shown and charged in ${currencyNames}. Our prices are set in pounds sterling and converted with the exchange rate explained in our [Payment Policy](/policies/payment); you pay exactly the amount shown at checkout. Amounts in pounds on this page are converted the same way.`
    : `Prices are shown in ${currencyNames}; you can choose the currency at the top of the page. Our prices are set in pounds sterling; other currencies are converted with the exchange rate explained in our [Payment Policy](/policies/payment), and you pay exactly the amount shown at checkout.`;
  const gbp = (p: number) => `£${(p / 100).toFixed(2)}`;
  return {
    seller: BUSINESS.tradingAs,
    company: BUSINESS.legalName,
    number: BUSINESS.companyNumber,
    office: BUSINESS.address,
    email: BUSINESS.email,
    phone: BUSINESS.phone,
    hours: BUSINESS.hours,
    deliveryPrice: gbp(delivery.price),
    freeFrom: gbp(delivery.freeFrom),
    fxMargin: `${fxMarginPct} %`,
    currencyText,
    currencyNames,
    countries: delivery.countries.length === 1 && delivery.countries[0] === "GB" ? "the United Kingdom" : delivery.countries.join(", "),
  };
}

export const UPDATED = "2026-11-06";
