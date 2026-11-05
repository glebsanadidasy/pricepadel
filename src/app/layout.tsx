import type { Metadata, Viewport } from "next";
import { Lato } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { getCurrency } from "@/lib/currency";
import { BUSINESS } from "@/config/site";
import "./globals.css";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: { default: `${BUSINESS.name} — padel rackets, shoes, bags and accessories`, template: `%s | ${BUSINESS.name}` },
  description: "Padel rackets, shoes, bags, balls, apparel and accessories for men, women and kids. Shipping to the UK and Europe.",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
  robots: { index: false, follow: false }, // preview — opened for search engines at launch
};

export const viewport: Viewport = { themeColor: "#1a5fa4" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const currency = await getCurrency();
  return (
    <html lang="en-GB" className={`${lato.variable} antialiased`}>
      <body className="flex min-h-screen flex-col pb-[68px] lg:pb-0">
        <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-white focus:px-4 focus:py-2 focus:text-ink">
          Skip to content
        </a>
        <Header currency={currency} />
        <main id="content" className="flex-1">
          {children}
        </main>
        <Footer />
        <MobileNav />
      </body>
    </html>
  );
}
