# Design notes — Figma "Gurevich Stores", page **Padel** only

File key `jE0RQGT8mkAHT11pouOx5v`. Read on 2026-11-05.

## Access and its limits (important)
The Figma account has a **View seat** on a Professional plan. After 8 MCP calls Figma answered
"You've reached the Figma MCP tool call limit for your View seat". What was obtained before the limit:

| Obtained | Use |
|---|---|
| Full layer tree of the Padel page (ids, names, positions, sizes, text content) | layout, texts, mobile structure |
| Render of `3:3` (desktop home, 2048×8102, 1:1 scale, 64 px margin each side) | visual reference, colour sampling |
| Design context (code + assets) for `3:4` (hero + header) | exact type sizes, header icons, logo vectors |
| `download_assets` for `19:505` (mobile home): first 20 images + first 20 SVGs | banners, section photos, logos, bottom-bar icons, UK flag |

**Not obtained** (hidden layers render empty, and the call limit stopped further requests):
- Visual render of the hidden section `19:488` (mobile `19:505`, desktop variant `19:10`) — only its layer tree.
- `19:11` PLAY HARDER slide picture (built from the tree + racket image + base photo).
- `19:1973` Racket Finder banner and `19:1823` popup — not needed this stage (hidden / not shown by rule).
- `19:1726` favicon — favicon is built from the logo's racket mark instead.
- `19:1721`, `19:1720`, `19:1719`, `19:1718` blog images in full size — cards use crops from the `3:3` render.
- Mid / Low balance rackets (`19:1817`, `19:1818`), "Made for the court" slides `19:1850–19:1852`, product photos of the slider.

## Colours
| Token | Hex | Where |
|---|---|---|
| lime | `#CCFF00` | primary buttons (text `#0055A4`), eyebrows on banners, balance "High" tile |
| royal | `#0055A4` | button text, "Premium padel. Fair price." eyebrow, counters |
| hero | `#1A5FA4` at 90 % | hero overlay; solid header on inner pages |
| ink | `#0C0C0C` | headings |
| body | `#555555` | body text |
| slate | `#2F3E46` | footer background, about heading |
| sky | `#2A9ED9` | blog category labels, "Continue Reading" |
| lime-ink | ≈`#A6C900` | ATTACK / ALL-ROUND / CONTROL |
| steel | ≈`#A8BFCC` | Mid balance tile |
| graphite | ≈`#333333` | Low balance tile |
| mist | ≈`#F2F2F2` | product card buttons |
| banner greens | `#97B701` / `#99B706`; banner blue `#1A568E` | baked into banner images |
| white 24 % | `rgba(255,255,255,.24)` | top bar divider |
| badge | white circle, text `#222` 10 px | wishlist/cart counters |

## Type — Lato (Google Fonts, weights 300/400/700/900)
| Role | Desktop | Mobile |
|---|---|---|
| Hero headline | Black 168/168, uppercase, centre | ~48 |
| Hero text | Regular 18/26, `#F4F4F4` | 14/20 |
| Hero button | Bold 16/17 uppercase, 45 px tall, 2 px lime border | 41 px tall |
| Section headings | Black 48/52.8 uppercase (two lines) | 34 |
| Centered section headings (Made for the court, Best products, From the blog) | Black ≈44 uppercase | 34 |
| Body | Regular 16/26 `#555` | same |
| Nav | Regular 14/20 uppercase white, 40 px gaps, active = 3 px white underline | — |
| Top bar | Regular 14/20 white | — |
| Banner eyebrow / title / text | Bold 13 tracked lime / Bold ≈34 uppercase / Regular 16/24 | 12 / 22 / hidden |
| Balance item | "High" Black 28 + "Balance" Light 28; tag Bold 22 uppercase lime-ink | same |
| About heading | Bold 40/46 slate | 34 |
| Product card | category 16 `#888`; name 16/24 ink; price 16 `#888`; button 12 uppercase on mist, 40 px | same |
| Footer | headings 14 uppercase; links 16/19, 17 px gaps | same |

## Layout (desktop 1920)
- Content width **1140** (x 390–1530). Header group x 398–1538. Feature rows 1274 wide (x 323–1597).
- Header: logo 170×79 at top 24; top bar (31 px, border-bottom) and nav row start 112 px right of the logo; icons search 18, wishlist 19.6, cart 19.6 with 16 px badges; currency pill 158×30 (flag 20×15, label, chevron 16) — from `19:396`.
- Hero `3:4`: 1920×1200 frame, visible area 1085 (banners overlap from y 1085). Arrows 18.6×40 at 35 px from the edges. Product image 315×315 over the headline.
- Banners `19:870`: three 640×299, text column from x 49.
- Rows `3:129`: image 622×522, text column 600; shoes row mirrored and right-aligned. Rows 28 px apart.
- Balance `3:155`: heading x 311; tiles 72×72 radius 8; racket image 483×678 at x 1048; big grey word behind the grip; dashed lime line through the ball.
- Made for the court `3:179`: slide 1170×680 centred, neighbours peek in greyscale.
- Best products `3:235`: 4 cards × 255, 34 px gaps, hover icons (eye, bag, heart) at the image's right edge.
- About `3:330`: circle photo ≈400, text from x ≈840, eyebrow + heading + 2 paragraphs + counters + button.
- Blog `3:345`: 4 cards 248 wide, image 248×186 with label at top 30.
- Footer `3:446`: 575 tall; columns 294 / 404 / 358; copyright bar 75.

## Mobile (390, from the layer tree of `19:505`)
- Header: hamburger 22×22 at (15, 56); logo 130×61 centred at top 15; cart 22×22 at right; **currency pill 158×30 at (15, 96)**.
- Hero 390×780: PLAY HARDER, text 344 wide, button 208×41, product image 143×143.
- Banners 390×182 each, centred text, outlined pill button 30 px tall.
- Rows: rackets image 360×302 first; shoes text first (right-aligned), image after; bags text first, image after.
- Balance: stacked items; Made for the court slide 390×585; products one per view with arrows; about; blog one per view.
- **Bottom bar `19:794`**: 390×68, four equal items (97.5 each): Home, Shop, Wishlist (badge 14 px), More; icons 23×23 over 13–16 px labels.
- Footer stacked: logo, text, company, Useful links (two columns 180 px), Latest posts, copyright, card logos.

## Components built
Header (desktop + mobile, account icon, currency switcher), mobile bottom bar, menu drawer, hero slider (2 slides),
category banners, feature rows, balance tabs, court carousel, product card + carousel, about block, blog cards,
footer, page hero (inner pages), catalogue filters, product variant picker, placeholder page.

## Assets in the project (all renamed neutrally)
| File | Source |
|---|---|
| `public/images/home/hero-1.jpg`, `hero-1-shoe.png`, `hero-2.jpg`, `hero-2-racket.png` | Figma exports (`3:4`, `19:505`) |
| `home/banner-shoes.png`, `banner-rackets.png`, `banner-accessories.png` | Figma (static PNG versions; the mockup layers are animated GIFs) |
| `home/section-rackets.png`, `section-bags.png`, `about.png`, `court-2.jpg` | Figma exports |
| `brand/logo.svg` | assembled from the 21 vector layers of the header logo (`3:28`) |
| `brand/logo-light.png`, `logo-dark.png`, `flags/gb.svg` | Figma exports |
| `favicon.svg` | racket mark cropped from `logo.svg` |
| **Temporary crops of the `3:3` render** (replace with originals): `home/section-shoes.png`, `home/balance.png` (grey word removed, background made transparent), `home/court-1.jpg` (headline and button are part of the picture), `blog/post-1…4.jpg`, `blog/thumb-1…3.jpg`, `brand/cards-visa-mastercard.png` (3D Secure and PCI badges cut off), `test-products/p2-a.jpg`, `p3-a.jpg`, `p4-a.png` |

## Licensing warning
`hero-1.jpg` (the hero background photo, Figma `image 63348116`) carries **Vecteezy watermarks** — visible when the
blue overlay is off. It must be licensed or replaced before launch. It is only used under the 90 % overlay.

## Deliberate changes from the mockup (project rules)
- Removed: "Fast delivery" (top bar), "free fast delivery", "best price guarantee", "used on the World Padel Tour",
  "tested, trusted and loved", "Top-rated", "delivered fast", "the gear our customers love most", 3D Secure and PCI DSS badges, the 10 % popup, Racket Finder banner.
- Counters 256+/15+/Fast UK delivery: shown only from the live catalogue — hidden now.
- Footer blurb: "for players across the UK and Europe" instead of "delivered fast across the UK".
- Company number/address show "[TBC]".
- Blog cards: no dates, comment counts or excerpts (articles not written).
- Product buttons: "Add to cart" on cards → "View product"/"Select options" (buying needs an account).
- The popup's "No thanks, I'll pay full price" will read "No thanks" if the popup is ever enabled.
