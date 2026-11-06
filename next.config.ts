import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

/** Old shop addresses → new pages, permanent (301/308). See old-site/report.md; the list goes live with the domain. */
function oldAddressRedirects(): { source: string; destination: string; permanent: true }[] {
  const file = path.join(process.cwd(), "data", "redirects.json");
  if (!fs.existsSync(file)) return [];
  const list = JSON.parse(fs.readFileSync(file, "utf8")) as { source: string; destination: string }[];
  return list.filter((r) => r.source.startsWith("/") && r.destination.startsWith("/")).map((r) => ({ ...r, permanent: true }));
}

/**
 * The payment provider's checkout page may be shown in a frame on our site (hosts from PAYMENT_CHECKOUT_HOSTS only).
 * Plain http is allowed only for a local test double in test mode. Nothing else may be framed.
 */
function checkoutOrigins() {
  const hosts = (process.env.PAYMENT_CHECKOUT_HOSTS ?? "").split(",").map((h) => h.trim().toLowerCase()).filter((h) => /^[a-z0-9.-]+$/.test(h));
  const test = (process.env.PAYMENT_MODE ?? "test") === "test";
  return hosts.flatMap((h) => (test && (h === "localhost" || h === "127.0.0.1") ? [`http://${h}:*`, `https://${h}:*`] : [`https://${h}`]));
}

function securityHeaders(frameable: boolean) {
  const origins = checkoutOrigins();
  const frameSrc = `frame-src 'self'${origins.length ? ` ${origins.join(" ")}` : ""}`;
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // The payment result page can be reached inside our own payment frame (the gateway sends the customer back there);
    // it then moves itself to the full window. Every other page may never be framed.
    { key: "X-Frame-Options", value: frameable ? "SAMEORIGIN" : "DENY" },
    // Payment Request (wallets) is allowed for us and the checkout page in the frame only.
    { key: "Permissions-Policy", value: `camera=(), microphone=(), geolocation=(), usb=(), payment=(self${origins.map((o) => ` "${o.replace(":*", "")}"`).join("")})` },
    {
      key: "Content-Security-Policy",
      value: `frame-ancestors ${frameable ? "'self'" : "'none'"}; ${frameSrc}; object-src 'none'; base-uri 'self'; form-action 'self'`,
    },
  ];
}

const nextConfig: NextConfig = {
  // Separate build folders for test / overnight checks, so they never disturb the preview's .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  async redirects() {
    return oldAddressRedirects();
  },
  async headers() {
    return [
      { source: "/((?!checkout/result).*)", headers: securityHeaders(false) },
      { source: "/checkout/result", headers: securityHeaders(true) },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
