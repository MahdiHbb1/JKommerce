# Stage 4.5A UI Foundation and Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the storefront shell, icon system, Home, and product card to the approved Heritage Editorial direction without changing catalog, cart, checkout, or order behavior.

**Architecture:** Add one design-token layer and one icon primitive, then apply them to the shell and Home. Home uses the existing Supabase catalog, keeps the current Quick View and add-to-cart callbacks, and removes the duplicate product grid. No new data source or deployment component.

**Tech Stack:** React 18, Vite 6, Tailwind 3, CSS variables, self-hosted Fontsource variable fonts, Phosphor Icons, Vitest, Playwright.

**Spec:** `DESIGN.md`; `docs/superpowers/specs/2026-10-19-jkommerce-upgrade-design.md` Stage 4.5.

## Global Constraints

- UI bilingual id/en, Indonesian first; no untranslated visible strings.
- No fake claims, testimonials, ratings, sales labels, or free-shipping promises.
- Money remains integer rupiah and formatted by the existing formatter.
- Interactive targets at least 44 x 44 px; keyboard and Escape behavior preserved.
- No em dash in visible copy.
- No new backend, hosting, payment, or admin architecture.
- Preserve existing `fetchProducts`, `toCardProduct`, Quick View, wishlist, and cart contracts.
- Respect `prefers-reduced-motion`; no endless decorative animation.

## Review Focus

- A product card must remain fully usable without hover and must not nest a button inside a link.
- The mobile bottom navigation must not cover the footer or the focused form field.
- The hero must use a real catalog image and must not invent a product claim when the catalog is empty.
- Fonts must load without the Google Fonts network request and must remain legible at 390 px.
- Search, Quick View, cart drawer, wishlist, and checkout entry must behave exactly as before.

---

### Task 1: Design tokens, self-hosted fonts, and icon primitive

**Files:**
- Modify: `package.json`, `package-lock.json` through npm install
- Modify: `src/main.jsx`, `src/index.css`, `tailwind.config.js`
- Create: `src/styles/tokens.css`, `src/components/ui/Icon.jsx`
- Test: `src/components/ui/__tests__/Icon.test.jsx`

**Interfaces:**
- Consumes: existing React and Vite setup.
- Produces: CSS variables in `tokens.css`; `Icon({ name, size = 20, weight = 'regular', className, ...props })`; font families `Inter Variable` and `Playfair Display Variable`.

- [ ] **Step 1: Write the failing Icon test**

Test that `name="search"` renders an SVG with `aria-hidden="true"`, `size={24}` sets width/height, and an unknown name returns no SVG.

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/components/ui/__tests__/Icon.test.jsx --maxWorkers=1`
Expected: FAIL because `Icon.jsx` does not exist.

- [ ] **Step 3: Install dependencies and implement tokens/fonts/Icon**

Run: `npm install @fontsource-variable/inter @fontsource-variable/playfair-display @phosphor-icons/react`

Create `tokens.css` with paper, ink, brown, gold, line, font, radius, shadow, spacing, and container variables. Import both Fontsource families in `main.jsx` before `tokens.css` and `index.css`. Remove the Google Fonts import from `index.css`. Update the Tailwind font families to the variable font names.

Create `Icon.jsx` as the only icon entry point. Map the functional names used by the shell and cards: `search`, `heart`, `bag`, `menu`, `close`, `user`, `home`, `shop`, `quickView`, `trash`, `plus`, `minus`, `arrowRight`, `check`, `truck`, `shield`, and `imageOff`. Use Phosphor `regular` weight by default, `1.75` stroke feel through the chosen weight, and `aria-hidden`.

- [ ] **Step 4: Run test, lint, and build**

Run the Icon test; run `npm run lint`; run `npm run build`.
Expected: Icon test PASS, lint 0 errors, build PASS.

- [ ] **Step 5: Commit**

Commit: `feat(ui): add heritage design tokens and icon system`

---

### Task 2: Shell, active navigation, skip link, and mobile bottom navigation

**Files:**
- Modify: `src/components/Layout/Header.jsx`, `src/components/Layout/Layout.jsx`, `src/components/Layout/Footer.css`, `src/data/translations.js`
- Create: `src/components/Layout/MobileBottomNav.jsx`

**Interfaces:**
- Consumes: `Icon` from Task 1; `useCart().getTotalItems`; `useWishlist().wishlistCount`; `useTranslation`.
- Produces: mobile bottom navigation with links `/`, `/shop`, `/wishlist`, `/cart`, `/account`; no new route.

- [ ] **Step 1: Implement the shell**

Header uses the paper token, a warm border, active desktop nav underline, Phosphor icons, and a visible `Menu` label on mobile. Remove wishlist and cart icons from the mobile header because the bottom nav owns them; keep desktop wishlist/cart. Mobile menu remains for Tentang Kami, Riwayat Pesanan, and language.

Add `MobileBottomNav` fixed at the bottom, `md:hidden`, with five real destinations, counts on Favorit and Keranjang, and `aria-current` via `NavLink`. Add safe-area padding and reserve footer space so the bar never covers content.

Add a skip link in `Layout` and `id="main-content"` on `main`. Add `nav.menu` and `common.skipToContent` translations.

- [ ] **Step 2: Verify behavior**

Run lint. In the browser at 1360 and 390, verify active nav, menu Escape, bottom nav counts, no horizontal overflow, 44 px targets, and no console/page errors.

- [ ] **Step 3: Commit**

Commit: `feat(ui): rebuild storefront shell and mobile navigation`

---

### Task 3: Home editorial layout and product card

**Files:**
- Modify: `src/pages/Home/Home.jsx`, `src/pages/Home/Home.css`, `src/components/ProductCard/ProductCard.jsx`, `src/data/translations.js`
- Test: `src/components/ProductCard/__tests__/ProductCard.test.jsx`

**Interfaces:**
- Consumes: existing `products`, `featuredProducts`, `onAddToCart`, `onQuickView`, `t`, `formatPrice`.
- Produces: Home with hero, three category links, one brand story block, one motif feature, and one product grid; ProductCard with no nested button inside an anchor.

- [ ] **Step 1: Write the failing ProductCard test**

Mock `useWishlist` and `useTranslation`, render one product inside `MemoryRouter`, and assert:
- no `a button` exists;
- the product name links to `/product/<slug>`;
- the add-to-cart button has the Indonesian label;
- no `Karya Pilihan` or `Pilihan Istimewa` badge is rendered without a real curation flag.

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/components/ProductCard/__tests__/ProductCard.test.jsx --maxWorkers=1`
Expected: FAIL on the nested anchor/button structure.

- [ ] **Step 3: Implement ProductCard**

Use an article container. Make only the image and product name links. Put the wishlist and Quick View controls outside the link, always visible at 44 px. Use `Icon`. Make the pattern label a readable neutral badge, keep out-of-stock status, and remove the duplicate green curated badge. Add the add-to-cart action outside the link.

- [ ] **Step 4: Rewrite Home**

Use one hero with a real catalog image from the first featured product, falling back to `motif-sogan.jpg` when the catalog is empty. The hero uses paper background, no dark overlay, and a real product caption. Keep the existing Quick View and add-to-cart callbacks.

Use three category links to `/shop?category=...`, one brand story block linking to `/about`, one motif feature with a large Parang image plus three motif entries, and one product grid. Remove the second product grid and all unused imports.

Add the new id/en copy keys for the hero, story, motif section, and product section.

- [ ] **Step 5: Rewrite Home.css**

Use token colors and a fluid type/space scale. Mobile is a designed state: hero stacks, category cards stack, motif feature stacks, product grid becomes one column, and no section uses `100vh`. Add only purposeful hover and reveal motion, guarded by the existing reduced-motion global rule.

- [ ] **Step 6: Run test, lint, build, and browser flow**

Verify Home at 1360 and 390: hero image loaded from the catalog, CTA to Shop, category links, story link, product add-to-cart, Quick View, wishlist, search, no overflow, 0 console/page errors.

- [ ] **Step 7: Commit**

Commit: `feat(ui): rebuild home and product card for heritage editorial`

---

### Task 4: Final verification and delivery evidence

**Files:**
- Modify: `docs/runbook/stage-0-1-acceptance.md`
- Modify: `.superpowers/sdd/2026-10-19-stage-0-1-foundation-catalog-orders/progress.md`

- [ ] **Step 1: Run verification**

Run Icon and ProductCard tests, the existing Shop/ProductDetail/Checkout/OrderHistory tests, lint, and build. Record exact results.

Run Playwright at 1360 and 390: Home, Shop, Product Detail, Cart, Quick View, search, wishlist, mobile menu, bottom nav, footer. Capture screenshots and console/page errors.

- [ ] **Step 2: Run the antislop Delivery Gate**

Check Hard Gate, Purpose Gate, Liveliness, and Craftsmanship. Record PASS/FAIL with evidence. Do not mark go-live ready; checkout remains blocked by missing shipping zones and undeployed functions.

- [ ] **Step 3: Update docs and commit**

Commit: `docs: record UI foundation and home delivery evidence`

- [ ] **Step 4: Push the branch and let PR #1 update**

Push only after the local gate passes. Do not merge.
