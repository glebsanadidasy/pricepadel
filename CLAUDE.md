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
- Company: PRICE PADEL LTD — company number and address **[TBC]**
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
- At most 1 request per second (everything: pages and photos). Never bypass site protection.
  On a block, captcha, HTTP 403 or 429 the collector stops and the owner is told.
- User-Agent: `PricePadelCatalog/1.0 (+contact@pricepadel.com)`.
- Collection resumes from where it stopped. Raw data (sitemap, pages, original photos, state) lives in `.source-data/` — git-ignored, never committed.

**Full collection** (stage 3): every product in the sitemap, no per-category limit. Out-of-stock products are stored
(without photos) for later refreshes. HTTP 503: wait 20–40 s; a series of 503s: wait 15 min and carry on.
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
- Delivery is **free for the customer**: checkout shows a "Free delivery" line at £0 before payment.
  Our own delivery cost (what we pay) is kept in the admin panel: £12.95 under £85, £6.95 from £85 to £169.99, free from £170.
- Price and stock refresh command without re-downloading photos. Out-of-stock products and variants are hidden.

## Not to copy from the mockup as-is
- Without owner confirmation do not show: best price guarantee, free delivery, fast delivery, in stock,
  used on the World Padel Tour, "tested, trusted and loved", PCI DSS / 3D Secure badges, 10% discount, the popup.
- Counters 256+, 15+, 220+: only from the real catalogue; hidden while there is no data.
- Where the mockup says UK only → say UK and Europe, without delivery-time promises.
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
  `npm run catalog:collect -- --limit 60` (collect, resumable; `--limit 0` = whole sitemap) →
  `npm run catalog:sheets` (contact sheets in `.source-data/review/`; decisions go to `data/catalog/photo-review.json`) →
  `npm run catalog:import` (builds `data/catalog/products.json`, photos to `public/images/products/` — git-ignored, rebuilt from `.source-data`) →
  `npm run catalog:refresh` (prices + stock only, no photos). Report for the owner: `data/catalog/import-report.md`.
- `data/catalog/products.json` holds supplier fields; read it only through `src/lib/catalog-store.ts` (server-only).
  `src/lib/catalog.ts` copies public fields one by one (`toPublic`) — never spread an imported record into a page.
  Settings (markups, delivery, hidden sources, `rewriteApproved`): `data/catalog/settings.json`, edited in the admin panel.
- Admin panel `/admin` (overview, products): local preview only (`next dev`) until admin sign-in exists; 404 in production.
- Old-site redirects will be read from `data/redirects.json` by `next.config.ts` (list in `old-site/report.md`).
- Taken from ~/orbex-chronogem (code only): stack/config choices, security headers + redirect loader in `next.config.ts`,
  `eslint.config.mjs`, the `AutoSubmit` filter helper. Nothing else (no data, texts, payment module, names).

## Open items for the owner
- Figma: View seat hit the MCP call limit — originals of some pictures are still temporary crops (see design/design-notes.md).
- Hero background photo carries Vecteezy watermarks — needs a licence or replacement before launch.
- Old site named HYPERION MOTION LTD (17358996) as the operator; new site uses PRICE PADEL LTD — owner to confirm.
- Catalogue (stage 2): our own delivery cost per order is not set yet (admin → Delivery).
  Apparel photos on the source are mostly worn by models → most apparel ends up hidden; owner to decide.
  Colour-specific photos are not collected (the source loads them separately), so a multi-colour product shows one colour's photos.
  Shoe sizes are EU sizes as on the source. Full-catalogue photo check needs a decision (manual review of ~10k photos).

## Stage log
- Stage 1 (2026-11-05): Git, old-site research, design notes, home page, catalogue, product page, preview with test products.
- Stage 2 (2026-11-05): catalogue collector for Padel Nuestro UK, 60-product sample imported, admin panel (sources, markups, delivery, products).
