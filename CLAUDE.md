# Price Padel — new online store (pricepadel.com)

Replacement for the old pricepadel.com, which was lost after the hosting was hacked.

## Working with the owner
- The site is in **English**. Talk to the owner in **Russian**, simply — the owner is not a programmer.
- Make technical decisions yourself; ask only about business questions.
- Do only the stage the owner asked for, then stop.

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
- Work only on this computer. Do not publish, buy or register anything. Do not change DNS or domain mail.
- `~/orbex-chronogem` is **read-only**. Never open `.env` or `env.sh` files (anywhere). Never ask the owner for passwords.
- Secrets live only in `.env`, which is git-ignored.
- Suppliers, source shops and source prices are visible **only in the admin panel**. They must never reach public pages, URLs, photo file names or customer-facing API responses.
- Do not invent reviews, ratings, discounts, stock availability, trust badges or company history.
  Do not write "official" or "authorised dealer" without the owner's confirmation.
- No shop scraping/parsing at this stage.

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
- Test products: `src/data/test-products.ts`, all `isTest: true`; shown only in `next dev` or with `SHOW_TEST_PRODUCTS=1`.
- Old-site redirects will be read from `data/redirects.json` by `next.config.ts` (list in `old-site/report.md`).
- Taken from ~/orbex-chronogem (code only): stack/config choices, security headers + redirect loader in `next.config.ts`,
  `eslint.config.mjs`, the `AutoSubmit` filter helper. Nothing else (no data, texts, payment module, names).

## Open items for the owner
- Figma: View seat hit the MCP call limit — originals of some pictures are still temporary crops (see design/design-notes.md).
- Hero background photo carries Vecteezy watermarks — needs a licence or replacement before launch.
- Old site named HYPERION MOTION LTD (17358996) as the operator; new site uses PRICE PADEL LTD — owner to confirm.

## Stage log
- Stage 1 (2026-11-05): Git, old-site research, design notes, home page, catalogue, product page, preview with test products.
