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
};

export function facts(delivery: { price: number; freeFrom: number; countries: string[] }, fxMarginPct: number): Facts {
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
    countries: delivery.countries.length === 1 && delivery.countries[0] === "GB" ? "the United Kingdom" : delivery.countries.join(", "),
  };
}

export const UPDATED = "2026-11-06";
