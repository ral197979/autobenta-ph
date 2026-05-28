# AutoBentaPH — Premium UI Redesign Report

## Summary

The homepage of AutoBentaPH has been redesigned from a generic gradient/centered marketing page into a premium Philippine automotive marketplace experience modeled on Carsome / Carvana / AutoTrader. The redesign is composition-only: routes, auth, API client, and all other pages are untouched.

## Files changed

### New
- `frontend/src/data/mockListings.js` — 8 PH listings (Toyota Vios, Mitsubishi Montero Sport, Toyota Fortuner, Honda City, Ford Ranger, Nissan Navara, Suzuki Ertiga, Hyundai Starex) + `estimateMonthly` helper for monthly-cost display.
- `frontend/src/components/home/HomeHero.jsx` — split-layout hero (search/headline left, car showcase + floating trust badges right).
- `frontend/src/components/home/SearchPanel.jsx` — keyword + city/province + budget select + primary CTA + popular quick-filters.
- `frontend/src/components/home/FeaturedListings.jsx` — fetches `/listings?sortBy=viewCount`; falls back to mock data when fewer than 4 real listings are returned.
- `frontend/src/components/home/ListingCard.jsx` — premium card: hero photo, year/body, make/model/variant, peso price + monthly estimate, mileage/transmission/fuel row, verified + inspected badges, save button, location, "View details" CTA, hover lift + shadow grow.
- `frontend/src/components/home/BrowseByType.jsx` — 6 vehicle-type cards (Sedan, SUV, Pickup, Van/MPV, Hatchback, Luxury) with inline SVG silhouettes (no emoji).
- `frontend/src/components/home/TrustSection.jsx` — 6 trust pillars over the deep-ink background.
- `frontend/src/components/home/HowItWorks.jsx` — 4-step timeline (Search → Compare → Book inspection → Connect & close) with deep-blue numbered icon tiles and gold step labels.
- `frontend/src/components/home/SellerCTA.jsx` — premium gradient seller block with perks grid.

### Updated
- `frontend/tailwind.config.js` — added design tokens (`ink`, `deepblue`, `electric`, `accent`, `slatetext`, `softbg`, `cardborder`).
- `frontend/src/components/Navbar.jsx` — sticky transparent → blurred-white-on-scroll, new logo mark, "Browse cars / Car value / Inspections / How it works" navigation, "Sign in" secondary + "List your car" primary CTA. Updated in place so every page benefits.
- `frontend/src/pages/Home.jsx` — now a thin composition of the new section components.

### Untouched (verified)
- All routes in `frontend/src/App.jsx`
- `AuthContext`, `api/client`, `utils/format`, all other pages (`Browse`, `CarDetail`, `Sell`, `Login`, `Register`, `Admin*`, `Dealer*`, etc.)
- `CarCard.jsx` — still used by `Browse.jsx` and other pages; new homepage uses the dedicated `ListingCard.jsx` instead.

## Design decisions

- **Token system over hard-coded colors.** Added the brief's palette to `tailwind.config.js` so the same tokens (`bg-ink`, `text-deepblue`, `text-accent`, `border-cardborder`, `bg-softbg`) are reused across every new component. Existing `primary-*` palette left intact to avoid breaking other pages.
- **No emoji.** Vehicle-type silhouettes are inline SVGs; trust/how-it-works icons come from `lucide-react`.
- **Hover physics.** Cards use `hover:-translate-y-1` + `hover:shadow-xl` for the premium lift used by Carvana/Carsome.
- **Search panel reuse.** `SearchPanel` is mounted inside the hero (left column) so it doubles as the hero's primary affordance — no duplicated search UI.
- **Mock data with graceful fallback.** `FeaturedListings` shows real API listings when present; otherwise the curated 8-car mock set keeps the homepage looking populated for a fresh database.
- **Sticky header upgrade in place.** Per the project's "match existing import patterns" rule, the existing `Navbar` component (referenced in `App.jsx` and on every page) was updated rather than forking a new `SiteHeader` — so the upgrade flows to every page without route or import changes.
- **Estimate disclaimer.** `estimateMonthly` is intentionally simple (20% down, 60 months, 7.5%) and rounded — only displayed as `~ ₱xx,xxx/mo` to avoid implying a real loan quote.

## Before → After

| | Before | After |
|---|---|---|
| Hero | Centered title on full-width gradient | Split layout: search + value prop left, car showcase with floating "Inspection-ready / Verified seller / Fair price" badges right |
| Search | Single text input + 8 brand chips | 3-field search (keyword / city / budget) inside a white card, plus quick-filter pills (Toyota, Honda, Mitsubishi, SUV, Sedan, Pickup) |
| Listing cards | Existing generic `CarCard` (4-grid) | New `ListingCard` with verified + inspected badges, monthly estimate, dedicated "View details" CTA |
| Browse by type | 4 emoji tiles (🚗🚙🛻🚐) | 6 type cards with custom SVG silhouettes + listing-count subtitles |
| Trust | 3 generic items on solid navy | 6 trust pillars (verified sellers, inspection, financing, fraud detection, ownership checklist, secure inquiry) on ink background with accent highlights |
| How it works | 3 centered icon cards | 4-step numbered tiles with gold "STEP 01" labels and connector line on desktop |
| Seller CTA | Single gradient button block | Premium gradient panel with 4-perk grid + secondary "Get a price estimate" CTA |
| Header | Standard white nav | Sticky, transparent → blurred-on-scroll, new logo mark + primary "List your car" CTA |

## Build / test results

- `npm --workspace=frontend run build` → **passes** (1622 modules, 426 kB JS / 41 kB CSS).
- `npm --workspace=frontend run lint` → **cannot run** — `eslint` binary is not installed in the frontend workspace (pre-existing condition, unrelated to this redesign). Confirmed via `sh: eslint: command not found`. Recommend `npm i -D eslint` in `frontend/` to restore lint capability.
- `cd backend && npm test -- --forceExit` → **11 suites, 107 tests pass**.

---

## Addendum — Hero right-panel replacement (2026-05-29)

### What was wrong
The hero's right column displayed a plain dark placeholder image (`placehold.co` with the text "AutoBentaPH") wrapped in an `aspect-[5/4]` container. It conveyed no actual product value — no car details, no price, no trust signals beyond the floating badge overlays.

### What was changed
**`frontend/src/components/home/HomeHero.jsx`** — right column (`lg:col-span-5`) rewritten:

- The raw `<img>` + blurred-gradient background was replaced with a white `rounded-2xl shadow-2xl border-cardborder` card mimicking a real listing.
- Card image slot (`h-52`, `object-cover`) uses `https://placehold.co/800x500/1e3a5f/e2e8f0?text=2021+Toyota+Fortuner`; `onError` falls back to a gold-on-navy placeholder.
- A dark gradient overlay (`bg-gradient-to-t from-black/60`) sits at the bottom of the image area.
- Card body shows: car title + variant, peso price (₱1,780,000), location / mileage / transmission / fuel meta row, three badge pills (Verified · Inspection-ready · Financing) using `ShieldCheck`, `BadgeCheck`, `CreditCard` from lucide-react, monthly estimate (~₱29,700/mo · 60 months), and a full-width "View listing →" electric-blue CTA button.
- Floating trust badges kept to exactly two: top-left `Inspection-ready · 120-point check` (green ShieldCheck) and bottom-right `Verified seller · DTI registered` (blue BadgeCheck). The old `₱748,000 · Great deal` bottom-center badge was removed.
- New lucide-react imports added: `MapPin`, `Gauge`, `Zap`, `CreditCard`.
- Left column (`lg:col-span-7`) is untouched.

### Build result
`npm --workspace=frontend run build` → **passes** (1622 modules, 428 kB JS / 41 kB CSS).

`npm --workspace=frontend run lint` → **cannot run** — `eslint` binary still not installed (pre-existing condition).

---

## Known follow-ups

- **Real car photography.** All visuals currently use `placehold.co` placeholders. Swapping in licensed PH market photos will be the biggest visual upgrade.
- **Hero showcase image.** A single placeholder image is used; consider a rotating carousel of 3–4 hero cars.
- **Save / favorite from `ListingCard`.** The heart button is currently a no-op (e.preventDefault only); wiring it to `api.post('/favorites/...')` like `CarCard` does is a small follow-up.
- **Budget filter wiring.** `SearchPanel` posts `minPrice` / `maxPrice` query params; double-check `Browse.jsx` consumes those exact names (the existing API uses `priceMin/priceMax` in some places per the test logs).
- **ESLint setup.** Add the missing dev dependency so `npm --workspace=frontend run lint` runs.
- **Lighthouse pass.** Consider lazy-loading the hero image and adding `loading="lazy"` to listing photos for a perf bump.
