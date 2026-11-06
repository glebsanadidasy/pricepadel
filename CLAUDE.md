# Price Padel — new online store (pricepadel.com)

Replacement for the old pricepadel.com, which was lost after the hosting was hacked.

## Working with the owner
- The site is in **English**. Talk to the owner in **Russian**, simply — the owner is not a programmer.
- Make technical decisions yourself; ask only about business questions.
- Do only the stage the owner asked for, then stop.
- **Autonomous (overnight) mode**, when the owner says so: work to the end without confirmations and without questions.
  Write every disputable decision into `overnight-report.md` and carry on.

## Git and GitHub
- Private repository `glebsanadidasy/pricepadel` (https://github.com/glebsanadidasy/pricepadel). Pushing work there is allowed.
  Before every push check it is still private (`gh repo view --json isPrivate`); if not — push nothing and tell the owner.
- Never force-push. Never use Git LFS.
- Never in Git: `sources/` (supplier data), original photos, raw collection data (`.source-data/`), `.env`, customer data (`.data/`, `outbox/`).
- Product photos (`public/images/products/`) are in Git, in hash sub-folders (< 3000 files per folder).
  If `.git` grows past 8 GB, stop adding photos to Git and say so in the report.

## Hard limits (always)
- Do not publish the site, buy, register, change DNS or mail, write to people, or delete working data.

## Goal (final product)
- Padel rackets, shoes, bags, balls, apparel and accessories for men, women and kids.
- Sizes and colours are product **variants**.
- Mandatory registration before purchase, customer account, wishlist, cart, admin panel, order e-mails.
- Payment **only by Visa or Mastercard on the payment gateway's hosted page** (no card entry on our site).
- Currencies: EUR, GBP, USD. Sales to the UK and Europe.

## Business data
- Seller: **HYPERION MOTION LTD, trading as Price Padel** (owner, stage 4). Company number 17358996.
  Registered office: Academy House, 11 Dunraven Place, Bridgend, Mid Glamorgan, United Kingdom, CF31 1JF. VAT number [TBC].
- Orders & support: contact@pricepadel.com
- Partnerships: partners@pricepadel.com
- Phone: +44 7576 567089
- Hours: Mon–Fri, 9am–5pm (UK)

## Design
- Figma: https://www.figma.com/design/jE0RQGT8mkAHT11pouOx5v/Gurevich-Stores (file key `jE0RQGT8mkAHT11pouOx5v`)
- Use **only the "Padel" page**. Other pages are unrelated to this store.
  - `3:3` desktop home — main reference
  - `19:488` hidden section with desktop + mobile home — take the mobile view and the currency switcher from it
  - `19:11` PLAY HARDER slide
  - `19:1823` popup (NOT shown yet — see rules)
  - `19:1973` Racket Finder banner (hidden for now, separate stage)
  - `19:1726` favicon
  - `19:1721`, `19:1720`, `19:1719`, `19:1718` blog images
- Font Lato; button #CCFF00 with text #0055A4; headings #0C0C0C; body text #555555; footer #2F3E46. Everything else from Figma.
- Details: `design/design-notes.md`.

## Rules
- Work only on this computer (plus pushes to the private GitHub repo). Do not publish, buy or register anything. Do not change DNS or domain mail.
- `~/orbex-chronogem` is **read-only**. Never open `.env` or `env.sh` files (anywhere). Never ask the owner for passwords.
- Secrets live only in `.env`, which is git-ignored.
- Suppliers, source shops and source prices are visible **only in the admin panel**. They must never reach public pages, URLs, photo file names or customer-facing API responses.
- Do not invent reviews, ratings, discounts, stock availability, trust badges or company history.
  Do not write "official" or "authorised dealer" without the owner's confirmation.

## Catalogue import from Padel Nuestro (owner rules, stage 2)
Work only on this computer: never publish, buy or register anything.

**How to collect**
- Read https://www.padelnuestro.com/robots.txt first and obey it (checked by the collector before every request).
- Product list only from https://www.padelnuestro.com/uk/media/sitemap_uk_product.xml. No filter pages, pagination, search or login.
- At most 1 request every 2 seconds (owner, stage 3; everything: pages, photos, colour data). Never bypass site protection or limits —
  no User-Agent / IP changes or browser disguise, even if asked; slow down instead.
  On a block, captcha, HTTP 403 or 429 the collector stops and the owner is told.
- User-Agent: `PricePadelCatalog/1.0 (+contact@pricepadel.com)`.
- Collection resumes from where it stopped. Raw data (sitemap, pages, original photos, state) lives in `.source-data/` — git-ignored, never committed.

**Full collection** (stage 3): every product in the sitemap, no per-category limit. Out-of-stock products are stored
(without photos) for later refreshes. HTTP 503: wait 20–40 s; a series of 503s: wait 15 min and carry on; 503 for 3 hours in a row: stop, keep everything, report it.
503 periods and their share are recorded in `.source-data/http-stats.json` and shown in overnight-report.md.
Block / captcha / 403 / 429: wait 1 hour and try once more; if it repeats, stop, keep everything collected, write the reason to the report.

**What to take**: name, brand, article (SKU), category, audience, variants and their stock, current GBP price, specifications, description,
up to 5 photos in the best quality. Categories: rackets, shoes, apparel, bags, balls, accessories.

**What not to take**
- Gift cards, Pickleball, Beach Tennis, Packs.
- Reviews, ratings, blog articles, gifts, promotions.
- Old prices, discounts, Bestseller / Outlet / Exclusive badges.
- Delivery, return and warranty promises.
- Mentions of Padel Nuestro: remove only that sentence from the description and list the product in the report.

**Photos and descriptions**
- Photos are downloaded into the project (no hot-links to the source). Public file names are neutral.
- Do not remove watermarks or logos. Do not use photos with the Padel Nuestro logo or overlaid text.
  Photos with people are not allowed, **except apparel: photos on models are allowed** (owner, stage 3).
  If no other photo is left, hide the product and list it in the report.
- Photos are not checked by eye any more: automatic checks only (broken / too small files, local OCR for "Padel Nuestro").
- Photos of other colours are collected when the source serves them through ordinary public requests allowed by robots.txt;
  the gallery switches with the chosen colour.
- Do not generate new descriptions until the owner turns on `rewriteApproved`.
- Every product and photo keeps its source and collection date. Admin has a button that hides everything from a source at once.

**Prices and stock**
- Source price and source link are visible only in the admin panel.
- Retail price = source price × 1.15. The markup can be changed per category and per brand.
- Source prices already include VAT (final prices).
- Customer delivery (owner, stage 4): **£12.95 for orders under £100, free from £100**, editable in the admin panel.
  Shown on the product page, in the cart and at checkout, never with delivery-time promises. **UK only** for now.
  Our own delivery cost (what we pay) is kept in the admin panel: £12.95 under £85, £6.95 from £85 to £169.99, free from £170.
- Price and stock refresh command without re-downloading photos. Out-of-stock products and variants are hidden.

## Stage 4 decisions (owner)
- Exchange rates: ECB daily reference rates + configurable margin (2 %), manual rate possible in admin; a rate older than
  3 days switches that currency off with an admin warning. The customer is charged exactly the amount shown.
- Not padel products (antiseptics, cosmetics, food supplements, medical / therapeutic goods) are hidden by an import rule.
- Affiliate Program and Brand Ambassador are hidden (404, no links) until those programmes exist.
- Cookie banner with an equal Reject button; the site sets only strictly necessary cookies.
- Policies: detailed drafts in `src/content/policies/`, plain English, numbered sections, "Last updated" date.
  Never name the supplier, never say goods come from our warehouse or ship from the UK, never claim a lawyer wrote or checked them,
  never limit statutory rights; unknown facts stay [TBC] (questions in `sources/policy-questions.md`).
  Research and legal sources: `sources/policy-research.md` (not in Git). Review by a UK lawyer is mandatory before launch.
- Launch blockers live in `launch-checklist.md`.
- Margins are reported before card fees and taxes; prices are not changed without the owner.

## Not to copy from the mockup as-is
- Without owner confirmation do not show: best price guarantee, free delivery, fast delivery, in stock,
  used on the World Padel Tour, "tested, trusted and loved", PCI DSS / 3D Secure badges, 10% discount, the popup.
- Counters 256+, 15+, 220+: only from the real catalogue; hidden while there is no data.
- Delivery area: UK only for now (stage 4), without delivery-time promises.
- "No thanks, I'll pay full price" → neutral wording.
- Do not carry over YouTube layers, internal layer names or old file names. All public files get new neutral names.
- Racket Finder block hidden for now (separate stage).

## Preview / test data
- Preview products are taken from the mockup slider and flagged `isTest: true`; they must never reach the live catalogue.

## Tech
- Next.js 16.4.5 (App Router, `src/`), React 19, TypeScript, Tailwind CSS 4 (tokens in `src/app/globals.css`), Lato via `next/font`.
  This Next.js has breaking changes vs. older docs — read `node_modules/next/dist/docs/` before using an unfamiliar API.
- Preview: `npm run dev` → http://localhost:3100 (`.claude/launch.json` name `price-padel`).
- Screenshots for design checks: `node scripts/screenshots.mjs [outDir] [paths…]` (1920 and 390 wide, uses playwright-core).
- Business data: `src/config/site.ts`. Currencies: `src/config/currency.ts` (GBP base; EUR/USD use PREVIEW placeholder rates).
- Catalogue: `src/lib/catalog.ts` (filters, live + test products). Public product type `src/lib/catalog-types.ts` — never add supplier fields there.
- Test products: `src/data/test-products.ts`, all `isTest: true`; shown only in `next dev` or with `SHOW_TEST_PRODUCTS=1`, and only while the live catalogue is empty.
- Catalogue pipeline (`scripts/catalog/`, rules in the section above):
  `npm run catalog:collect -- --limit 0` (collect, resumable) → `npm run catalog:import` (photos to `public/images/products/xx/`,
  automatic photo checks incl. local OCR `scripts/catalog/ocr/ocr.swift`) → `npm run catalog:refresh` (prices + stock only, no photos).
  `node scripts/catalog/check-public.mjs <baseUrl>` = leak + price check; `node scripts/catalog/margins.mjs` = margin check.
- Overnight runner: `nohup caffeinate -ims scripts/overnight/run.sh >/dev/null 2>&1 &` (state/logs in `.overnight/`, updates `overnight-report.md`).
  It commits only `data/catalog` + photos, holding `.overnight/git.lock`; take the same lock (mkdir) before committing code.
- Data: `data/catalog/products.json` + `settings.json` (public, in Git); `sources/<id>/offers.json` (source links, prices, stock, SKUs — never in Git),
  read only through `src/lib/catalog-store.ts` (server-only). `src/lib/catalog.ts` copies public fields one by one (`toPublic`).
- Customers: SQLite (`node:sqlite`) in `.data/store.db` (`src/lib/db.ts`); auth `src/lib/auth.ts` (scrypt, hashed session tokens, rate limits);
  cart cookie `src/lib/cart.ts` (server re-prices); orders `src/lib/orders.ts`; e-mails go to `outbox/` (`src/lib/mail.ts`) until mail is connected.
- Payments: only the gateway's hosted page. Local simulation `/mock-gateway/[id]` + signed webhook `/api/payments/webhook` (`src/lib/payments.ts`);
  Paid only from a verified notification. Mock is on in `next dev`, or with `MOCK_PAYMENTS=1`.
- Admin `/admin` (login with `ADMIN_PASSWORD` from `.env`; never print it): orders, products (hide product / photo), markups, rates, delivery cost.
- Secrets in `.env`: `ADMIN_PASSWORD`, `PAYMENT_WEBHOOK_SECRET`.
- Tests: `npx playwright test` (own server on :3200 with a copy of the data in `.test-data/` and test-only secrets); `SCREENS=1` adds screenshots.
- `NEXT_DIST_DIR` selects the build folder (`.next-test`, `.next-overnight`) so checks never disturb the preview.
- Old-site redirects will be read from `data/redirects.json` by `next.config.ts` (list in `old-site/report.md`).
- Taken from ~/orbex-chronogem (code only): stack/config choices, security headers + redirect loader in `next.config.ts`,
  `eslint.config.mjs`, the `AutoSubmit` filter helper. Nothing else (no data, texts, payment module, names).

## Open items for the owner
- Figma: View seat hit the MCP call limit — originals of some pictures are still temporary crops (see design/design-notes.md).
- Hero background photo carries Vecteezy watermarks — needs a licence or replacement before launch.
- Shoe sizes are EU sizes as on the source. Terms & Conditions and other policy texts are still empty pages.
- With free delivery and 15 % markup, single-item orders under ~£86 source price lose money (see overnight-report.md).

## Stage log
- Stage 1 (2026-11-05): Git, old-site research, design notes, home page, catalogue, product page, preview with test products.
- Stage 2 (2026-11-05): catalogue collector for Padel Nuestro UK, 60-product sample imported, admin panel (sources, markups, delivery, products).
- Stage 3 (2026-11-05/06, overnight): full collection runner, supplier data moved to sources/, private GitHub repo, accounts, cart, checkout,
  mock payment gateway, orders + e-mails to outbox, admin login, Playwright tests. Report: overnight-report.md.
