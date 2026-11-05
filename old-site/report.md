# Old pricepadel.com — remnants report

Research date: 2026-11-05. Read-only: nothing was submitted, registered or changed, and no `.env`/`env.sh` files were opened.

**Main caveat.** The Wayback Machine has **no captures** of pricepadel.com, and neither does Common Crawl. Almost everything below comes from **search-engine index snippets** (titles, URLs, short excerpts). Snippets have no capture date; context (blog posts dated 28 May 2026, spam posts mentioning October) suggests **late May – October 2026**. Prices are indicative. **(?)** = uncertain or inferred.

## Browser check (built-in browser, 2026-11-05)
- `https://pricepadel.com` — navigation failed (no response).
- `https://web.archive.org/web/2026*/pricepadel.com` — "The Wayback Machine has not archived that URL."
- `https://web.archive.org/web/*/pricepadel.com*` (URL list) — "Wayback Machine failed to return archive information" (empty).

## Summary
- Domain is live in DNS but the web server does not respond: ports 80/443 time out on 85.198.99.26 (Beget LLC, Russia), bare domain and www.
- Domain registered 2026-05-13 at Namecheap, expires 2027-05-13. TLS certificates from 2026-05-14 to 2026-09-11 — the site existed roughly May–October 2026.
- No Wayback captures (CDX exact/prefix/domain, availability API, calendar). Nothing in Common Crawl (CC-MAIN-2026-21 … 2026-43). archive.today timed out — **not checked**.
- Platform: WordPress + WooCommerce (/product/, /product-category/, /product-tag/, /brand/, /?product=, filter_*). `et_columns-count` suggests the XStore theme (?).
- **Hacked with SEO spam**: at least 35 casino/betting posts (Mostbet, 1win, Pin Up, Pinco …, in RU/CZ/PL/AZ/DE/IT/DA/EN) at the root, plus spam categories /category/casino/ and /category/сплиты/.
- **The old site named a different company: HYPERION MOTION LTD**, company no. 17358996, Academy House, 11 Dunraven Place, Bridgend, CF31 1JF (from the privacy policy snippet). Contact: contact@pricepadel.com, +44 7576 567089. Prices in GBP. → see Open questions.
- Tagline "Premium Padel. Fair Price."; ~20 brands; 3 real blog posts; full set of policy pages.
- No local files of the old site on this Mac (Spotlight).

## Live domain status
| Check | Result |
|---|---|
| https://pricepadel.com, https://www…, http://…, http://www… | Timed out, no HTTP response |
| A | 85.198.99.26 (Beget LLC, RU) — not a Cloudflare IP, so not proxied |
| www | CNAME → pricepadel.com |
| NS | johnathan.ns.cloudflare.com, ximena.ns.cloudflare.com |
| MX | mx1/mx2.privateemail.com (Namecheap Private Email) |
| TXT | SPF for privateemail.com and mlsend.com; MailerLite verification |
| Whois | Namecheap; created 2026-05-13, updated 2026-05-14, expires 2027-05-13; clientTransferProhibited |
| crt.sh | Let's Encrypt / Google Trust Services: 2026-05-14, 2026-07-12/13, 2026-09-09/11 for pricepadel.com, www, *.pricepadel.com |

Nothing was changed in DNS or mail (project rule).

## Captures
- Wayback Machine: **0**. Common Crawl: none in 2026. Firecrawl: no cache. archive.today: timed out.
- Search-engine index: ~**230 distinct URLs** — ~140 product pages, ~35 spam posts, the rest pages, categories, brands, tags, filter variants.

## Pages & navigation (reconstructed, order approximate)
- **Header:** Shop, Contact, Blog, FAQ, Racket Finder.
- **Footer "USEFUL LINKS":** Terms & Conditions, Privacy, Cookie, Shipping, Return, Payment, Warranty, Acceptable Use, Disclaimer, FAQ, About Us, Contact, Partnerships, Affiliate Program, Brand Ambassador, Size Guide.
- **Footer other:** brand blurb, "Mon–Fri, 9am–5pm (UK)", email, phone, Instagram and LinkedIn (URLs not captured), "LATEST POSTS", company details.
- **Newsletter:** 10% code signup (MailerLite).
- **Shop:** 12/24/36/All per page; sidebar with categories, price filter, search. Racket attributes: Balance (low/mid/high), Hardness, Play Style (All-round/Attack/Control), Player level (Beginner–Pro), Shape (Round/Teardrop/Diamond). Quick View, related products, variable products.

Confirmed URLs: `/`, `/shop/`, `/racket-finder/`, `/size-guide/`, `/brand-ambassador/`, `/terms-and-conditions/`, `/privacy-policy/`, `/cookie-policy/`, `/warranty-policy/`, `/acceptable-use-policy/`, `/author/pricepadel/`, `/category/gear-reviews/`.
Linked but slug **not seen**: Shipping, Return ("Returns & Refunds Policy"), Payment, Disclaimer, FAQ, About Us, Contact, Partnerships, Affiliate Program, Blog index.

## Categories
- **Rackets** `/product-category/rackets/` → Padel Rackets `/product-category/rackets/padel-rackets/`; also `/product-category/padel-rackets/` (duplicate/legacy?).
- **Shoes** `/product-category/shoes/` (Padel Shoes, Junior Padel Shoes — URLs not seen).
- **Bags** (breadcrumb only; probably `/product-category/bags/` ?).
- **Clothing** `/product-category/clothing/` → `/clothing/mens-tee/`, `/clothing/womens-skirts-shorts/`; Junior Clothing; "Tops & Vests" (?).
- **Accessories** `/product-category/accessories/` → `/accessories/caps/`, `/padel-balls/`, `/towels/`, `/wristbands/`; also Overgrips, Padel Grips, Pick-Up Tubes, Protection Tape, Wrist Strap (URLs not seen).
- One snippet: "136 products · Bags · 110 products · Caps · 8" (which category the numbers belong to is unclear).
- Brand pages `/brand/<slug>/`: adidas, bullpadel, head, nox, padel-fuel, pallap, siux, varlion, wilson.
- Tags like `collection_adidasmetalbone`, plus `-default-title` slug suffixes — look like a Shopify import (?).

Brands in product names: 4on, Adidas, Asics, Babolat, Bullpadel, Cuera, Dunlop, HEAD, K-Swiss, Kanso, Lok, Nox, Padel Fuel, PADELIZED, Pallap, Robin Soderling, Royal Padel, Siux, Tecnifibre, Varlion, Wilson; The Bandeja.com magazine.

## Products with a price (GBP, date unknown ≈ May–Oct 2026)
| Product | Price | Source | Old URL |
|---|---|---|---|
| Babolat TRX Pro Comp Padel Racket | £120.99 | product page | /product/babolat-trx-pro-comp-padel-racket/ |
| Siux Fenix Pro 5 Black Padel Racket | £331.99 | product page | /product/siux-fenix-pro-5-black-padel-racket/ |
| Adidas Drive Padel Racket 2026 Blue/Lime | £68.99 (?) (£83.99 also seen) | product page | /product/adidas-drive-padel-racket-2026-blue-lime/ |
| Dunlop Galactica OS by Nisse LTD Padel Racket | £193.99 (?) | product page | /product/dunlop-galactica-os-by-nisse-ltd-padel-racket/ |
| Varlion Bourne 8.8 Padel Racket | £115.99 | product page | /product/varlion-bourne-8-8-padel-racket/ |
| Nox EA10 Ventus Attack 12K Xtreme Edu Alonso Padel Racket 26 | £246.99 | product page | /product/nox-ea10-ventus-attack-12k-xtreme-edu-alonso-padel-racket-26/ |
| Nox ML10 Pro Cup Light Padel Racket | £121.99 | product page | /product/nox-ml10-pro-cup-light-padel-racket/ |
| HEAD Coello Pro 2026 Padel Racket | £268.99 | product page | /product/head-coello-pro-2026-padel-racket/ |
| Bullpadel Vertex 05 Geo Premier Padel Edition | £345.99 | product page | /product/bullpadel-vertex-05-geo-premier-padel-edition-padel-racket/ |
| Bullpadel Xplo Premier Padel Edition | £345.99 | related widget | /product/bullpadel-xplo-premier-padel-edition-padel-racket/ |
| Bullpadel Neuron 02 Premier Padel Edition | £345.99 | related widget | /?product=bullpadel-neuron-02-premier-padel-edition-padel-racket |
| Adidas Arrow Hit Ctrl Padel Racket 2026 | £327.99 | shop listing | not seen |
| Adidas Adipower 10th Anniversary Padel Racket | 247.99 (£ implied) | category listing | /product/adidas-adipower-10th-anniversary-padel-racket/ |
| Adidas Adipower Multiweight Ctrl Pro Edition 25 | 323.99 (£ implied) | category listing | not seen |
| HEAD Speed Padel Racket 2026 Keyring | £3.30 | product page | /product/head-speed-padel-racket-2026-keyring/ |
| Bullpadel Tour Racket Bag 26 – Black | £39.99 | product page | /product/bullpadel-tour-racket-bag-26-black-default-title/ |
| Adidas Multigame Backpack 2026 Off White | 68.99 (£ implied) | related widget | /product/adidas-multigame-backpack-2026-off-white-off-white-default-title/ |
| Bullpadel Men's Indiga 26V Padel Shoes White | £73.99 | related widget | /product/bullpadel-mens-indiga-26v-padel-shoes-white/ |
| Bullpadel Men's Indiga 26V Padel Shoes Navy Yellow | 73.99 (£ implied) | related widget | not seen |
| HEAD Men's Motion Team Padel Shoes White Black | £68.99 | related widget | /product/head-mens-motion-team-padel-shoes-white-black/ |
| Cuera Women's Active Zip Jacket Dark Brown – X-Small | £72.99 | related widget | not seen |
| Nox Men's Agustin Tapia AT10 Sponsor T-Shirt Light Grey | £37.99 | related widget | not seen |

Padel Rackets price filter ran ≈ £50–£380.

**Seen without a price** (all `/product/<slug>/` unless noted):
- Rackets — Adidas: Arrow Hit Hexagon, Arrow Hit Junior 2026 Blue, Drive 3.4 Grey, Match 2026 Black/Lime · Babolat: Air Veron 2.6, Alioth Junior, Technical Viper 3.0, Technical Viper Soft 3.0, Technical Viper Juan Lebron 25 · Bullpadel: Elite W 26, Hack 04 Comfort 26, Icon 26, Indiga CTR 26, Indiga PWR 26, Indiga Girl Junior 26, Ionic Control 26, Open Control 25, Pearl 26, Vertex Junior 26, Wonder 26, Xplo Comfort 26 · Dunlop: Aero-Star, Aero-Star Lite, FX Team 2026, FX Start 2026 (/?product=) · HEAD: Coello Team 2026, Radical Team Light 2026 · Lok: Easy Hype Gen 2, Maxx Flow Gen 2 · Nox: Quantum 12k Cobalt 2025 · PADELIZED: Aero-Power Team, Aero-Power Tour · Pallap: Power Pro, Power Star · Royal Padel: Anniversario Limited Edition Light 36, Anniversario Poly 36, Whip Light 26 · Siux: Beat Hybrid 3 2026, Diablo Go 4 · Tecnifibre: Bomba Soft, Curva Power · Varlion: LW 8.8 · Wilson: Accent LT, Bela Pro V3, Carbon Force, Carbon Force LT, Defy V1.
- Shoes — Adidas: Men's Crazyquick Boost Lucid Orange, Women's Crazyquick LS White Metallic · Asics: Men's Gel Challenger 15, Men's Sonicsmash FF, Women's Game FF AW25 · Babolat: Men's Jet Premura 2 25, Jet Viva 25, Movea 2 26 (two colours), Premura 3 Black/Gold, Premura 3 Lebron Blue Depths, Premura 3 Seaport (/?product=), Women's Sensa 25, Sensa Rise · Bullpadel: Men's Hack Vibram 25l Bubblegum, Ionic 25l Dark Blue (/?product=), Ionic 25l White Royal, Women's Ionic 25l White Orange, Pearl Vibram 25I Black, Pearl Vibram 25I Grey, Vertex Vibram 25V Grey UK 6.5 · K-Swiss: Ultra Court Black Anthracite Red, Ultra Court Sanyo · Kanso: EQ SC 2026 Blue/White · Wilson: Men's Bela Tour, Rush Pro 5, Women's Hurakn Lite.
- Bags — Adidas: Shoe Bag 3.4, Tour Racketbag 2026 Bronze · Babolat: Court S · Bullpadel: Neuron 26 Grey, Xplo 26 Black · Dunlop: Pro Series · HEAD: Base M, Pro X L, Tour L Sage · Wilson: Bela Backpack, Bela Super Tour, Defy V1 bag, Super Tour 2026 Red, Team Black, Tour Red.
- Balls — Bullpadel Next Pro FIP 3-ball tube (/?product=), Dunlop Fort (dozen), Robin Soderling Padel Tour X (dozen), Tecnifibre Team (dozen), Wilson Premier Padel Speed (dozen).
- Accessories & clothing — 4on Grip Paste; Bullpadel Comfort Overgrip 50-pack; Bullpadel Replacement Grip; Wilson Padel Guard Protection Tape; Bullpadel Premier Padel Towel 100×50; HEAD Coello 2026 Keyring; Bullpadel BPG251 Cap, BPV251 Visor, Premier Padel Caps; Lok Never Luck Cap; The Bandeja.com Padel Magazine Issue 5; Adidas Men's Padel Category Graphic T-Shirt Red; Babolat Men's Crew Neck Tee Lebron 26; Cuera Men's Active Light Weight T-Shirt Sand.

## Texts worth reusing (summaries only)
- Tagline "Premium Padel. Fair Price."; footer blurb about premium gear at fair prices (it also promised fast UK delivery — not reused, project rule).
- Home sections on community, shoes (grip, ankle support, cushioning; men's/women's/junior) and bags — the same ideas as the Figma mockup.
- Terms: retailer of rackets, footwear, clothing, bags, balls, accessories; UK customers, shipping worldwide; cancellation by email with a model form.
- Warranty: refund within 30 days for faulty/misdescribed items; repair/replacement 30 days–6 months; 6-year limit (England & Wales) mentioned; replies within 5 business days.
- Privacy: data controller HYPERION MOTION LTD. Cookie and Acceptable Use policies: standard texts.
- Size Guide: UK/EU/US shoe conversion and clothing charts.
- Brand Ambassador: call for players, coaches and creators.
- Blog (author "PricePadel", 28 May 2026): "The Complete Guide to Padel Balls"; "Master Your Grip: The Complete Guide to Padel Grips & Overgrips"; "Women's Guide to Padel: Everything You Need to Get Started" (`/womens-guide-to-padel-everything-you-need-to-get-started/`).
- Product descriptions look like manufacturer copy — rewrite rather than reuse.
- Policies are **not** copied into the new site (this stage writes no policies).

## Old URLs for redirects
| Old path | New path |
|---|---|
| / | / |
| /shop/ (+ ?filter_*, ?et_columns-count) | /shop |
| /product-category/rackets/ (+ /page/N/), /product-category/rackets/padel-rackets/, /product-category/padel-rackets/ | /shop?category=rackets |
| /product-category/shoes/ | /shop?category=shoes |
| /product-category/bags/ (?) | /shop?category=bags |
| /product-category/clothing/ (+ /mens-tee/, /womens-skirts-shorts/) | /shop?category=apparel |
| /product-category/accessories/padel-balls/ | /shop?category=balls |
| /product-category/accessories/ (+ /caps/, /towels/, /wristbands/) | /shop?category=accessories |
| /brand/<brand>/ | /shop?brand=<Brand> |
| /product-tag/<tag>/ | /shop |
| /product/<slug>/ | /product/<slug> (drop "-default-title" and redirect the old one) |
| /?product=<slug> | /product/<slug> (query-aware rule) |
| /racket-finder/ | /shop?category=rackets (until the Racket Finder stage) |
| /size-guide/ | /faq |
| /brand-ambassador/ | /brand-ambassador |
| /terms-and-conditions/ | /policies/terms |
| /privacy-policy/ | /policies/privacy |
| /cookie-policy/ | /policies/cookies |
| /warranty-policy/ | /policies/warranty |
| /acceptable-use-policy/ | /policies/acceptable-use |
| /shipping-policy/, /return-policy/, /payment-policy/, /disclaimer/ (?) | /policies/shipping, /policies/returns, /policies/payment, /policies/disclaimer |
| /faq/, /about-us/, /contact/ (?) | /faq, /about, /contact |
| /partnerships/, /affiliate-program/ (?) | /partnerships, /affiliate-program |
| /blog/ (?), /category/gear-reviews/, /author/pricepadel/ | /blog |
| /womens-guide-to-padel-everything-you-need-to-get-started/ | /blog/womens-guide-to-padel |
| /category/casino/, /category/сплиты/ and ~35 root spam posts | **410 Gone** |

Spam examples: /kak-proverit-koeffitsienty-na-1win-ofitsialnyi-sait/, /prozkoumani-platebnich-metod-dostupnych-v-mostbet-kasinu/, /behind-the-scenes-how-cocobet-maintains-fair-play/, /pinco-casino-zerkalo-ponimanie-chestnosti-igry/, /casino-uden-om-rufus-en-sikker-spillemulighed/, /legal-implications-of-casino-utan-svensk-licens-a-flashback-review/, /kak-rabotaet-1khbet-zerkalo-pri-ogranicheniiakh-dostupa-v-rossii/ — and others containing mostbet, pin-up, aviator, 1vin, lemon-casino, fontan-casino, luckyvegas.

Real blog posts also lived at the root, so no catch-all: explicit redirects for known paths, 410 for root slugs with spam keywords (casino, kasino, kasyn, mostbet, 1win, 1vin, 1khbet, pin-up, pinco, aviator, bet, sportwetten, free-spin), normal 404 otherwise. Ask Google Search Console to remove the spam URLs at launch. The redirect list will go into `data/redirects.json` (read by `next.config.ts`) when the domain moves.

## Local files (mdfind)
- `mdfind -name padel`: 5 results; `mdfind -name pricepadel`: 1 result (plus a content search `mdfind pricepadel`: 5).
- **None relate to the old site.** Excluded: ~/PricePadel itself (the new project); 4 Xcode SDK headers `GCDirectionPadElement.h` (false match); 2 internal Claude app files under ~/Library/Application Support/Claude/git-shadow/.
- Spotlight reports "unknown indexing state" for /Users/gazman, so home-folder coverage may be incomplete (?). Nothing was opened or changed.

## Open questions
1. **Company:** the old site named HYPERION MOTION LTD (17358996, Bridgend). The new site uses PRICE PADEL LTD as instructed. Which company runs the new shop?
2. Is there a WordPress/WooCommerce backup (DB dump, wp-content/uploads), a product CSV, or access to the Beget hosting? That recovers images, descriptions, prices.
3. Was there an earlier Shopify store ("-default-title" suffixes)?
4. Instagram and LinkedIn URLs?
5. Exact slugs of Shipping/Return/Payment/Disclaimer/FAQ/About/Contact/Partnerships/Affiliate/Blog pages (Google Search Console "Pages" report would list them).
6. Is the MailerLite account and subscriber list still available?
7. Keep old `/product/<slug>/` slugs for 1:1 redirects? (The new site already uses `/product/<slug>`.)
