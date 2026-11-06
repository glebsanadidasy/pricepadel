import { defineConfig, devices } from "@playwright/test";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * End-to-end tests. They run their own server (port 3200) on a COPY of the catalogue, with an empty customer
 * database and outbox in .test-data/, and test-only secrets — the real data, .env values and preview are untouched.
 *   npx playwright test
 */
const ROOT = process.cwd();
const DATA = path.join(ROOT, ".test-data");
const PORT = 3200;
const GW_PORT = 3201;
const FAKE_GATEWAY_PORT = 3299;

// Fresh copy of the data for every run (the config file is loaded once, before the server starts).
if (!process.env.PP_TEST_DATA_READY) {
  fs.rmSync(DATA, { recursive: true, force: true });
  fs.mkdirSync(path.join(DATA, "catalog"), { recursive: true });
  for (const f of ["products.json", "settings.json"]) fs.copyFileSync(path.join(ROOT, "data/catalog", f), path.join(DATA, "catalog", f));
  fs.cpSync(path.join(ROOT, "sources"), path.join(DATA, "sources"), { recursive: true, filter: (src) => !src.endsWith(".md") });
  // Exchange rates for the test copy: EUR with a fresh manual rate, USD only with a 5-day-old ECB rate (must be switched off).
  const settingsFile = path.join(DATA, "catalog", "settings.json");
  const settings = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
  const old = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
  settings.fx = {
    marginPct: 2,
    fetchedAt: new Date().toISOString(),
    EUR: { ecb: 1.19, ecbDate: old, manual: 1.2, manualAt: new Date().toISOString() },
    USD: { ecb: 1.34, ecbDate: old, manual: null, manualAt: null },
  };
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
  fs.writeFileSync(
    path.join(DATA, "secrets.json"),
    JSON.stringify({ admin: crypto.randomBytes(12).toString("base64url"), webhook: crypto.randomBytes(32).toString("hex"), gateway: crypto.randomBytes(32).toString("hex") }),
  );
  process.env.PP_TEST_DATA_READY = "1";
}
const secrets = JSON.parse(fs.readFileSync(path.join(DATA, "secrets.json"), "utf8")) as { admin: string; webhook: string; gateway: string };
process.env.TEST_ADMIN_PASSWORD = secrets.admin;
process.env.TEST_WEBHOOK_SECRET = secrets.webhook;
process.env.TEST_GATEWAY_SECRET = secrets.gateway;
process.env.TEST_GW_BASE = `http://localhost:${GW_PORT}`;
process.env.TEST_FAKE_GATEWAY_PORT = String(FAKE_GATEWAY_PORT);

const common = {
  CATALOG_DIR: path.join(DATA, "catalog"),
  SOURCES_DIR: path.join(DATA, "sources"),
  OUTBOX_DIR: path.join(DATA, "outbox"),
  ADMIN_PASSWORD: secrets.admin,
  MOCK_PAYMENT_SECRET: secrets.webhook,
  FX_AUTO: "0",
  SMTP_PASS: "", // tests never send real mail: everything goes to the test outbox
};
const noGateway = { PAYMENT_API_BASE_URL: "", PAYMENT_API_TOKEN: "", PAYMENT_WEBHOOK_SECRET: "", PAYMENT_ACCOUNT_ID: "", PAYMENT_MODE: "test", PAYMENT_LIVE_ENABLED: "false" };
process.env.TEST_DATA_DIR = DATA;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "test-results/e2e.json" }]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 900 } } }],
  webServer: [
    {
      // Main test server: local payment simulation, no card gateway (all PAYMENT_* emptied so .env values never apply).
      command: `npx next dev -p ${PORT}`,
      url: `http://localhost:${PORT}/`,
      timeout: 240_000,
      reuseExistingServer: false,
      env: { ...common, NEXT_DIST_DIR: ".next-test", STORE_DB: path.join(DATA, "store.db"), MOCK_PAYMENTS: "1", ...noGateway },
    },
    {
      // Card-gateway test server: talks to a local test double of the gateway (tests/e2e/gateway.spec.ts), test mode only.
      command: `npx next dev -p ${GW_PORT}`,
      url: `http://localhost:${GW_PORT}/`,
      timeout: 240_000,
      reuseExistingServer: false,
      env: {
        ...common,
        NEXT_DIST_DIR: ".next-test-gw",
        STORE_DB: path.join(DATA, "store-gw.db"),
        MOCK_PAYMENTS: "0",
        PAYMENT_API_BASE_URL: `http://localhost:${FAKE_GATEWAY_PORT}`,
        PAYMENT_API_TOKEN: "test-token-not-real",
        PAYMENT_WEBHOOK_SECRET: secrets.gateway,
        PAYMENT_ACCOUNT_ID: "test-account",
        PAYMENT_MODE: "test",
        PAYMENT_LIVE_ENABLED: "false",
      },
    },
  ],
});
