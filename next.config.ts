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

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return oldAddressRedirects();
  },
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
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
