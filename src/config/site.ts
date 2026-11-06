/** Business data (owner, stage 4): the shop is run by HYPERION MOTION LTD, trading as Price Padel. */
export const BUSINESS = {
  name: "Price Padel",
  legalName: "HYPERION MOTION LTD",
  tradingAs: "HYPERION MOTION LTD, trading as Price Padel",
  companyNumber: "17358996",
  companyRegister: "Registered in England and Wales", // [TBC] owner to confirm (Bridgend is in Wales; register shown on Companies House)
  address: "Academy House, 11 Dunraven Place, Bridgend, Mid Glamorgan, United Kingdom, CF31 1JF",
  email: "contact@pricepadel.com",
  partnersEmail: "partners@pricepadel.com",
  phone: "+44 7576 567089",
  phoneHref: "tel:+447576567089",
  hours: "Mon–Fri, 9am–5pm (UK)",
  domain: "pricepadel.com",
} as const;

export const MAIN_NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
] as const;

export const POLICY_PAGES = [
  { slug: "terms", label: "Terms & Conditions" },
  { slug: "privacy", label: "Privacy Policy" },
  { slug: "cookies", label: "Cookie Policy" },
  { slug: "shipping", label: "Shipping Policy" },
  { slug: "returns", label: "Return Policy" },
  { slug: "payment", label: "Payment Policy" },
  { slug: "warranty", label: "Warranty Policy" },
  { slug: "acceptable-use", label: "Acceptable Use Policy" },
  { slug: "disclaimer", label: "Disclaimer" },
] as const;

export const COMPANY_LINKS = [
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/partnerships", label: "Partnerships" },
] as const;

/** Instagram account is not confirmed yet — the icon links to the contact page until it is. */
export const INSTAGRAM_URL: string | null = null;
