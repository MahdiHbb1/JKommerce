# JKommerce — Plan 1: Fondasi + Katalog & Pesanan Nyata (Stage 0–1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah JKommerce dari demo tanpa backend menjadi situs yang ter-deploy di domain sendiri dengan katalog dari Supabase, pesanan tersimpan server-side, stok direservasi atomik, dan alur pesan-untuk-guest/login yang utuh — siap disambungkan ke pembayaran di Plan 2.

**Architecture:** React 18 + Vite SPA (tetap) membaca Supabase (PostgREST + RLS). Semua penulisan pesanan lewat Edge Function `create-order` → Postgres RPC `create_order` (satu transaksi: validasi → reservasi stok atomik → insert order/items/events). Logika murni (validasi tanpa dependency, perhitungan harga/pajak/ongkir) ditulis portabel TS agar bisa diuji Vitest tanpa Deno. Migrasi Supabase sebagai satu-satunya sumber perubahan skema. Hosting Cloudflare Pages + DNS Cloudflare.

**Tech Stack:** React 18, Vite 6, Tailwind 3, Supabase (Postgres + Auth + Storage + Edge Functions), Vitest + Testing Library, ESLint flat config, Cloudflare Pages, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-19-jkommerce-upgrade-design.md` (baca §0 keputusan, §5.3 model data, §5.4 state machine, §8 Stage 0–1).

## Global Constraints

- Node ≥ 20; npm dengan `package-lock.json` ter-commit; tidak menambah dependency runtime baru di Edge Functions selain `@supabase/supabase-js` (diimpor via `https://esm.sh/@supabase/supabase-js@2`); validasi ditulis tangan (tanpa zod) agar logika bisa diuji Vitest dan bebas risiko supply-chain.
- **Semua uang = integer rupiah** (tanpa desimal, tanpa float untuk perhitungan; pembulatan `Math.round` setengah ke atas pada nilai rupiah). Format tampil lewat `formatIDR` → `Rp1.234.567`.
- Nomor pesanan: `JK-YYYYMMDD-NNNN` (NNNN dari sequence, 4 digit, zero-padded).
- Status pesanan (enum, satu-satunya yang sah): `pending_payment`, `expired`, `cancelled`, `paid`, `packing`, `shipped`, `delivered`, `refunded`.
- Mode pajak default `included` (harga katalog = harga dibayar; nilai PPN yang terkandung dihitung dari `site_settings.tax_rate`, **tidak pernah** hardcode 11). NPWP & tarif dari `site_settings`.
- Copy untuk pengguna berbahasa Indonesia untuk konten (UI tetap bilingual id/en — setiap key baru wajib ditambahkan ke kedua bahasa di `src/data/translations.js`). **Tidak boleh ada klaim gratis ongkir, pajak, rating, atau ulasan palsu di teks mana pun.**
- Checkout **diblokir** (tidak bisa submit) selama `shipping_zones` kosong atau alamat tidak bisa dihitung ongkirnya (K8).
- Tidak ada secret di repo. `.env` lokal gitignored; kredensial Edge Function via `supabase secrets set`; kredensial hosting via dashboard.
- Semua perubahan skema lewat file di `supabase/migrations/` — tidak pernah edit lewat dashboard.
- Commit kecil per task (Conventional Commits: `feat|fix|chore|docs|test|ci`). Branch kerja: `stage-0-1`; PR ke `main` di akhir stage.
- RLS: anon **tidak** boleh `insert/update/select` baris pesanan siapa pun; satu-satunya penulisan pesanan lewat RPC SECURITY DEFINER yang dipanggil service-role dari Edge Function.

## Review Focus

Satu baris per hal yang paling mungkin menggigit pengguna, dengan test-nya di task pemilik kode:

1. **Uang & pembulatan pajak** (harga termasuk PPN; nota besar PPN vs total harus konsisten) → test di Task 10.
2. **Dobel pesan / klik ganda / retry jaringan** (dua order untuk satu niat beli) → test idempoten di Task 11.
3. **Dua pembeli berebut stok terakhir** (tidak boleh oversell) → race test di Task 4.
4. **UCAPAN/IDOR data guest** (lookup & batalkan pesanan orang lain lewat nomor+email) → test kecocokan email di Task 11 & 13.
5. **RLS bocor** (anon membaca/menulis `orders`) → assertion anon di Task 4.

---

### Task 1: Higiene working tree + branch kerja

**Files:**
- Modify: `.gitignore` (pastikan `.env`, `dist/`, `node_modules/` terabaikan)

**Interfaces:**
- Consumes: kondisi repo saat ini (ada pekerjaan Xendit yang belum di-commit).
- Produces: tree bersih di branch `stage-0-1`; pekerjaan lama tersimpan di history (bukan dihapus) supaya penggantian di Plan 2 jelas.

- [ ] **Step 1: Pastikan `.gitignore` memuat `.env`, `dist/`, `node_modules/`**

Baca `.gitignore`; tambahkan baris yang hilang.

- [ ] **Step 2: Commit pekerjaan lama apa adanya**

```bash
git checkout -b stage-0-1
git add -A
git commit -m "chore: simpan pekerjaan integrasi Xendit sebelum digantikan (tidak dipakai di produksi)"
```

- [ ] **Step 3: Verifikasi**

Run: `git status --short` — Expected: kosong. `git log --oneline -2` menunjukkan commit baru di branch `stage-0-1`.

---

### Task 2: Harness lint + test + CI minimal

**Files:**
- Create: `eslint.config.js`, `vitest.config.js`, `src/lib/money.js`, `src/lib/__tests__/money.test.js`, `.github/workflows/ci.yml`, `.github/dependabot.yml`
- Modify: `package.json` (scripts `lint`, `test`, devDependencies)

**Interfaces:**
- Produces: `formatIDR(amount: number): string` di `src/lib/money.js` (dipakai semua tugas berikutnya); perintah `npm run lint`, `npm test`, `npm run build` hijau; CI menjalankannya.

- [ ] **Step 1: Tulis test yang gagal untuk `formatIDR`**

```js
// src/lib/__tests__/money.test.js
import { describe, it, expect } from 'vitest';
import { formatIDR } from '../money.js';

describe('formatIDR', () => {
  it('format ribuan dengan titik', () => expect(formatIDR(1234567)).toBe('Rp1.234.567'));
  it('nol', () => expect(formatIDR(0)).toBe('Rp0'));
  it('menolak nilai non-integer', () => expect(() => formatIDR(10.5)).toThrow());
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npx vitest run src/lib/__tests__/money.test.js` — Expected: FAIL (modul belum ada).

- [ ] **Step 3: Setup harness & implementasi**

```bash
npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom eslint @eslint/js eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y globals pg
```

`vitest.config.js`: environment `jsdom`, `setupFiles: ['./src/test/setup.js']` (buat file setup berisi `import '@testing-library/jest-dom'`). `eslint.config.js`: flat config js + react + hooks + jsx-a11y, `ignores: ['dist/**','supabase/functions/**']`. `package.json` scripts: `"lint": "eslint ."`, `"test": "vitest run"`, `"test:watch": "vitest"`. Implementasi `formatIDR`:

```js
export function formatIDR(amount) {
  if (!Number.isInteger(amount)) throw new TypeError('Jumlah harus integer rupiah');
  return 'Rp' + amount.toLocaleString('id-ID');
}
```

- [ ] **Step 4: Test & lint hijau**

Run: `npm test` dan `npm run lint` — Expected: PASS, 0 error (warning a11y boleh dicatat, tapi dicicil beres di Stage 4).

- [ ] **Step 5: CI + Dependabot**

`.github/workflows/ci.yml`: trigger `push`/`pull_request` ke `main`; jobs: node 20 → `npm ci` → lint → test → build. **Pin semua action ke commit SHA** (dapatkan dengan `gh api repos/<owner>/<repo>/git/ref/tags/<tag>` — jangan pakai tag mengambang, checklist #61) dengan komentar versi di sebelahnya. `.github/dependabot.yml`: npm weekly + github-actions weekly.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "ci: harness lint+test (vitest/eslint), formatIDR, CI & dependabot"
```

---

### Task 3: (Owner + agent) Project Supabase & koneksi repo

**Files:**
- Create: `supabase/config.toml` (via `supabase init`), `scripts/verify-db.mjs`, `docs/runbook/00-supabase-setup.md`
- Modify: `.env.example` (bersihkan dari Xendit; hanya `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WHATSAPP_NUMBER`), `.env` lokal (gitignored, tidak di-commit)

**Interfaces:**
- Produces: project Supabase staging/production (satu project dulu — free tier; region Singapore), link CLI aktif, `.env` lokal berisi URL+anon key; `node scripts/verify-db.mjs` sebagai alat verifikasi berulang (Task berikutnya menambah assertion).

- [ ] **Step 1 (owner):** Buat organization + project Supabase bernama `janoer-koening` (region Singapore, password DB disimpan di tempat aman pemilik). Pandu lewat runbook yang ditulis di Task 3 Step 4.
- [ ] **Step 2 (agent):** `npx supabase login`, `npx supabase init`, `npx supabase link --project-ref <ref-dari-owner>`; catat ref di `docs/runbook/00-supabase-setup.md`.
- [ ] **Step 3:** Tulis `scripts/verify-db.mjs`: membaca `SUPABASE_DB_URL` dari env (owner/agent salin connection string dari dashboard — **jangan pernah commit**), konek `pg`, jalankan `select 1`, cetak `DB OK`; exit 1 kalau gagal. `.env.example` dibersihkan.
- [ ] **Step 4:** Tulis runbook `00-supabase-setup.md` (bahasa Indonesia, langkah demi langkah untuk pemilik: buat project → ambil URL/anon key → taruh di `.env` → jangan bagikan service key).
- [ ] **Step 5: Verifikasi**

Run: `node scripts/verify-db.mjs` — Expected: `DB OK`.

- [ ] **Step 6: Commit** (`chore: link Supabase, verify-db, runbook setup`)

---

### Task 4: Migrasi core — orders, items, events, cart, wishlist, RLS, fungsi stok & RPC

**Files:**
- Delete: `supabase/migrations/20260710090000_create_orders.sql`, `..._add_auth_support.sql`, `..._create_cart_wishlist_tables.sql`, `..._fix_order_rls.sql` (project baru tanpa data — tulis set bersih; alasan dicatat di commit)
- Create: `supabase/migrations/20261019120000_core.sql`, `20261019120100_catalog.sql`, `20261019120200_stock_and_orders.sql`, `20261019120300_cron.sql`
- Modify: `scripts/verify-db.mjs` (tambah assertion)

**Interfaces:**
- Produces (dipakai Task 7, 10, 11, 13):
  - Tabel: `orders(id uuid pk, order_number text unique, user_id uuid null, email text, customer jsonb, address jsonb, subtotal_idr int, shipping_idr int, discount_idr int, tax_idr int, total_idr int, tax_mode text, status text check(...), courier text, tracking_number text, note text, internal_note text, expires_at timestamptz, paid_at/shipped_at/delivered_at/cancelled_at timestamptz null, created_at, updated_at)` — item pesanan hidup di `order_items` (sumber tunggal; tanpa kolom jsonb duplikat), `order_items(order_id, product_id, variant_id, name_snapshot, variant_snapshot jsonb, qty int, unit_price_idr int, line_total_idr int)`, `order_events(order_id, event, from_status, to_status, actor, metadata jsonb, created_at)`, `products(..., needs_verification boolean default false)`, `product_variants(id uuid pk, product_id uuid fk, sku text unique, size text, color text, stock_on_hand int >= 0, stock_reserved int >= 0, is_active bool)`, `site_settings(id int pk check(id=1), business jsonb, tax jsonb, payment jsonb, legal jsonb)`, `shipping_zones(id uuid, name, rate_idr int, eta_min_days int, eta_max_days int, provinces text[], is_active bool)`, `stock_movements`, `idempotency_keys`, `rate_limits`.
  - Fungsi SQL: `is_admin()`, `check_rate_limit(p_key text, p_window_seconds int, p_limit int) returns boolean`, `reserve_order_stock(p_items jsonb)`, `release_order_stock(p_order_id uuid)`, `commit_order_stock(p_order_id uuid)`, `create_order(payload jsonb, p_idempotency_key text) returns jsonb`, `cancel_order_by_customer(p_order_number text, p_email text) returns jsonb`, `expire_pending_orders() returns integer`, `generate_order_number() returns text` (sequence `order_number_seq`).
  - Perilaku kunci: `create_order` dalam **satu transaksi** — cek idempotency (kalau key sudah ada, kembalikan order lama), hitung `expires_at = now() + interval '24 hours'`, nomor order, **reserve stok atomik** (`UPDATE product_variants SET stock_reserved = stock_reserved + q WHERE id = v AND stock_on_hand - stock_reserved >= q` — baris tak terpengaruh ⇒ RAISE `insufficient_stock`), insert order + items + `order_events('created')`, simpan `stock_movements('reserve')`.
  - RLS: `orders/order_items/order_events` — select milik sendiri (`auth.uid() = user_id`) atau `is_admin()`; **tidak ada policy insert/update untuk anon**; `products/product_variants` select publik hanya `is_active`; write hanya `is_admin()`; `site_settings` select publik untuk kolom aman lewat view `public_settings` (business/tax/payment/legal), write admin; `shipping_zones` select publik aktif, write admin.

- [ ] **Step 1: Tulis migrasi `..._core.sql`** (tabel orders/order_items/order_events/cart_items/wishlist_items + index + trigger `updated_at` + `is_admin()`).
- [ ] **Step 2: Tulis migrasi `..._catalog.sql`** (products/product_variants/site_settings/shipping_zones + RLS + view `public_settings`).
- [ ] **Step 3: Tulis migrasi `..._stock_and_orders.sql`** (fungsi stok + `create_order` + `cancel_order_by_customer` + `expire_pending_orders` + `check_rate_limit` + `idempotency_keys` + `rate_limits` + `generate_order_number`). Tulis SQL dengan `set search_path = public` di tiap fungsi SECURITY DEFINER; `grant execute` hanya ke role `service_role`.
- [ ] **Step 4: Tulis migrasi `..._cron.sql`**

```sql
create extension if not exists pg_cron;
select cron.schedule('expire-pending-orders', '*/15 * * * *', $$select public.expire_pending_orders();$$);
```

(kalau `create extension` ditolak, aktifkan pg_cron dari Dashboard → Database → Extensions, lalu jalankan ulang; dicatat di runbook).

- [ ] **Step 5: Push & perluas `verify-db.mjs`**

`npx supabase db push`. Assertion baru di `verify-db.mjs`: (a) semua tabel terdapat; (b) RLS aktif di `orders/product_variants/site_settings`; (c) **anon tidak bisa** `select`/`insert` `orders` (pakai koneksi `pg` dengan role `anon`: `set role anon; select ...` → harus error/kosong); (d) `create_order` menolak item tanpa stok (seed 1 varian stok 1 di script, lalu dua panggilan paralel `Promise.all` → tepat satu sukses — **race test**); (e) `cancel_order_by_customer('JK-...','salah@email')` → error; dengan email benar → status `cancelled` dan `stock_reserved` kembali.

- [ ] **Step 6: Verifikasi**

Run: `node scripts/verify-db.mjs` — Expected: semua assertion PASS.

- [ ] **Step 7: Commit** (`feat(db): skema inti, RLS ketat, fungsi stok atomik & RPC pesanan`)

---

### Task 5: (Owner + agent) Domain, Cloudflare Pages, deploy pertama

**Files:**
- Create: `public/_headers`, `public/_redirects`, `docs/runbook/01-hosting-domain.md`
- Delete: `vercel.json` (diterjemahkan; catat di runbook bahwa header hidup di `public/_headers`)

**Interfaces:**
- Produces: situs ter-deploy di domain pemilik dengan HTTPS + header keamanan + SPA fallback; URL produksi dipakai Task 7 (redirect pembayaran Plan 2) dan Task 11 (CORS `ALLOWED_ORIGINS`).

- [ ] **Step 1 (owner):** Beli domain. Kandidat utama `janoerkoeningbatik.com`; cek ketersediaan saat registrasi (Rumahweb/Namecheap), fallback `janoerkoeningbatik.id` / `batikjanoerkoening.com`. Pandu di runbook.
- [ ] **Step 2 (owner + agent):** Pindahkan DNS ke Cloudflare (ubah nameserver di registrar); buat akun Cloudflare.
- [ ] **Step 3:** `public/_headers` — terjemahkan header dari `vercel.json` apa adanya (CSP, HSTS, XFO, nosniff, Referrer-Policy, Permissions-Policy) + `Cache-Control` untuk `/assets/*`. `public/_redirects` — `/* /index.html 200`. Hapus `vercel.json`.
- [ ] **Step 4 (owner + agent):** Cloudflare Pages → Connect GitHub repo `JKommerce` (branch `main`), build command `npm run build`, output `dist`; env vars produksi: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WHATSAPP_NUMBER` (nomor asli atau dikosongkan — jangan placeholder publik). Custom domain dari Step 1.
- [ ] **Step 5: Verifikasi**

Run (setelah deploy): `curl -I https://<domain>/` → ada HSTS + CSP; `curl -I https://<domain>/.env` → 404/403; `curl -s https://<domain>/shop | head` → HTML aplikasi (SPA fallback jalan); buka di browser → halaman tampil tanpa error console; ganti mobile viewport.

- [ ] **Step 6: Commit** (`feat(deploy): Cloudflare Pages headers/redirects + runbook hosting`)

---

### Task 6: Lapisan data katalog (klien)

**Files:**
- Create: `src/lib/db/catalog.js`, `src/lib/db/__tests__/catalog.test.js`, `src/lib/db/types.js` (JSDoc typedef)
- Modify: `src/lib/supabaseClient.js` (tetap; pastikan hanya anon key)

**Interfaces:**
- Produces (dipakai Task 8, 9, 12, 13):
  - `fetchProducts({ includeInactive=false }) → Promise<Product[]>`
  - `fetchProductBySlug(slug) → Promise<Product|null>` (+ `variants` disertakan)
  - `fetchPublicSettings() → Promise<{business, tax, payment, legal}>`
  - `fetchShippingZones() → Promise<Zone[]>`
  - Tipe: `Product { id, slug, name, category, pattern, description, heritage, details, price_idr, images: string[], is_featured, is_bestseller, variants: Variant[] }`, `Variant { id, sku, size, color, stock_available }` (`stock_available = stock_on_hand - stock_reserved`).

- [ ] **Step 1: Tulis test gagal** — mock modul `supabaseClient` (`vi.mock`), assertion: `fetchProducts` memfilter `is_active=true`, memetakan `stock_available`, dan melempar error yang jelas saat supabase tidak terkonfigurasi (`isSupabaseConfigured === false` → `throw new Error('Supabase belum dikonfigurasi')`).
- [ ] **Step 2: Run** `npm test` — Expected: FAIL.
- [ ] **Step 3: Implementasi `catalog.js`** (query PostgREST `from('products').select('*, product_variants(*)')`, mapping snake_case → shape di atas, error handling eksplisit).
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** (`feat(catalog): lapisan data katalog dari Supabase`)

---

### Task 7: Seed katalog 14 produk + unggah gambar ke Storage

**Files:**
- Create: `scripts/seed/products.seed.json`, `scripts/seed-products.mjs`, `supabase/migrations/20261019120400_storage.sql` (bucket `product-images` & `content-images` publik-read, `payment-proofs` privat + policy unggah/baca sesuai desain)

**Interfaces:**
- Consumes: `create_order` ada (Task 4); kredensial service role (dari env lokal, tidak di-commit).
- Produces: 14 produk + varian (cross-product `sizes × colors`) di DB dengan `needs_verification = true`, gambar di `product-images/`, `site_settings` baris awal (tax mode `included`, rate `11`, payment kosong, business kosong), 1 zona ongkir contoh non-aktif.

- [ ] **Step 1:** Transkripsi `src/data/products.js` → `scripts/seed/products.seed.json` (semua field; gambar dipetakan ke nama file di `src/assets/images/`; stok placeholder tiap varian = 3, **ditandai** `"stock_placeholder": true`).
- [ ] **Step 2: Tulis `scripts/seed-products.mjs`** — idempoten (upsert by slug/sku): unggah gambar bila belum ada, insert produk+varian, insert settings+zona contoh. Jalankan dengan `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` dari env lokal (bukan hardcode).
- [ ] **Step 3: Jalankan** `node scripts/seed-products.mjs` — Expected: `14 produk, N varian, M gambar tersimpan`.
- [ ] **Step 4: Verifikasi DB**: tambah assertion `verify-db.mjs`: `count(products)=14`, tiap produk punya ≥1 varian, `public_settings` mengembalikan tax mode `included`.
- [ ] **Step 5: Commit** (`feat(seed): seed katalog & aset + storage buckets`)

---

### Task 8: Shop & Home membaca DB

**Files:**
- Modify: `src/pages/Shop/Shop.jsx`, `src/pages/Home/Home.jsx`, `src/data/translations.js` (key baru dua bahasa)
- Test: `src/pages/Shop/__tests__/Shop.test.jsx` (render dengan mock catalog: produk tampil, filter kategori bekerja, empty state & error state bekerja)

**Interfaces:**
- Consumes: `fetchProducts` (Task 6).
- Produces: katalog hidup dari DB; Home menampilkan featured/bestseller dari DB (bukan `src/data/products.js` lagi untuk bagian ini — file statis tetap ada sebagai arsip sampai semua halaman selesai dipindah).

- [ ] **Step 1: Test gagal** — Shop menampilkan 2 produk mock; filter "TULIS" menyisakan 1; saat fetch error tampil pesan + tombol "Coba lagi"; saat kosong tampil empty state.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implementasi**: ganti sumber data di Shop (state loading/error/data; skeleton yang sudah ada dipakai), hal yang sama untuk bagian featured/bestseller Home. Tambah key terjemahan (id+en) untuk error/empty/retry.
- [ ] **Step 4: Run** — PASS; `npm run build` hijau.
- [ ] **Step 5: Commit** (`feat(shop): katalog Shop & Home dari Supabase`)

---

### Task 9: Halaman produk — varian stok-akurat, tanpa ulasan palsu

**Files:**
- Modify: `src/pages/ProductDetail/ProductDetail.jsx`, `src/pages/ProductDetail/ProductDetail.css`, `src/data/translations.js`
- Test: `src/pages/ProductDetail/__tests__/ProductDetail.test.jsx`

**Interfaces:**
- Consumes: `fetchProductBySlug` (Task 6).
- Produces: pemilih ukuran/warna memetakan ke `variant_id` & `stock_available`; kombinasi stok 0 → tombol nonaktif berlabel "Stok habis"; **seluruh blok ulasan/rating karangan + form "tulis ulasan" dihapus** (schema Review menyusul pasca-launch); bagian "ulasan" diganti pesan netral: "Belum ada ulasan" (key terjemahan baru).

- [ ] **Step 1: Test gagal** — dengan mock produk 2 varian (satu stok 0): kombinasi stok 0 menonaktifkan tombol tambah-keranjang; tidak ada teks rating/"ulasan" selain empty state; Add to cart mengirim `variant` yang benar ke context.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implementasi** + hapus kode ulasan/rating palsu (termasuk state localStorage terkait).
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** (`feat(product): detail produk berbasis varian, hapus ulasan karangan`)

---

### Task 10: Modul murni Edge — validasi & harga (portable TS, diuji Vitest)

**Files:**
- Create: `supabase/functions/_shared/validate.ts`, `supabase/functions/_shared/pricing.ts`, `supabase/functions/_shared/__tests__/pricing.test.ts`, `supabase/functions/_shared/__tests__/validate.test.ts`
- Modify: `vitest.config.js` (include `supabase/functions/_shared/__tests__`)

**Interfaces:**
- Produces (dipakai Task 11, dan Plan 2):
  - `validateCreateOrder(body: unknown) → { ok: true, value: CreateOrderInput } | { ok: false, errors: string[] }` — `CreateOrderInput { items: {variant_id: string, qty: int>0}[] (1..20 baris, qty<=10), customer: {name: 2..80 char, email valid, phone 9..16 digit}, address: {recipient, phone, full_address, city, province, postal_code?, country='ID', note?}, payment_preference: 'manual'|'duitku', accepts: {tos: true, privacy: true, versions: {tos: string, privacy: string}}, idempotency_key: string 8..80 }`; tolak field tak dikenal.
  - `computeTotals(input: {lines: {qty: int, unit_price_idr: int}[], shipping_idr: int, discount_idr: int, tax: {mode: 'included'|'excluded'|'none', rate_percent: number}}) → { subtotal_idr, shipping_idr, discount_idr, tax_idr, total_idr }`.
  - Perilaku: `included` → total = subtotal + shipping − discount; `tax_idr = Math.round((subtotal − discount) * rate / (100 + rate))` (nilaian pajak yang terkandung, untuk nota); `excluded` → `tax_idr = Math.round((subtotal − discount) * rate / 100)`, total += tax; `none` → tax 0. Semua nilai integer ≥ 0; `shipping_idr` wajib > 0 kecuali... tidak ada pengecualian v1 (**tanpa gratis ongkir**) — nilai 0 ditolak dengan error `shipping_unavailable`.

- [ ] **Step 1: Tulis test gagal** — angka yang dikunci persis: (a) included 11%: subtotal Rp1.000.000 → `tax_idr = 99099` (1.000.000 × 11 / 111 = 99.099,099… dibulatkan) dan total tetap Rp1.000.000; (b) excluded 11%: subtotal Rp100.000 → `tax_idr = 11000`, total = 111.000; (c) none → tax 0; (d) qty 0 ditolak; field asing ditolak; email invalid ditolak; items > 20 ditolak; shipping 0 ditolak (`shipping_unavailable`).
- [ ] **Step 2: Run** `npm test` — FAIL.
- [ ] **Step 3: Implementasi tanpa dependency** (validator tulis tangan; jangan `eval`; hanya `Number.isInteger`, regex sederhana untuk email/telepon).
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** (`feat(edge): validasi input & kalkulasi harga/pajak murni + test`)

---

### Task 11: Edge Function `create-order` + `lookup-order` (rewrite)

**Files:**
- Create: `supabase/functions/create-order/index.ts`, `supabase/functions/_shared/supabaseAdmin.ts`, `supabase/functions/_shared/cors.ts`, `supabase/functions/_shared/ratelimit.ts`, `scripts/e2e/create-order.mjs`
- Modify: `supabase/functions/lookup-order/index.ts` (rewrite: DTO dipangkas), `supabase/functions/_shared/__tests__/cors.test.ts`

**Interfaces:**
- Consumes: `validateCreateOrder`, `computeTotals` (Task 10); RPC `create_order`, `check_rate_limit` (Task 4); `site_settings`, `shipping_zones`, `product_variants` (Task 7).
- Produces:
  - `POST /functions/v1/create-order` → 200 `{ order_number, status: 'pending_payment', totals, expires_at }`; 400 `{ error: 'validation_failed', errors }`; 409 `{ error: 'insufficient_stock' }`; 429 `{ error: 'rate_limited' }`; idempotent lewat `idempotency_key` (dobel → 200 dengan order yang sama).
  - `POST /functions/v1/lookup-order` `{ order_number, email }` → DTO **hanya**: `order_number, status, totals, items (nama, qty, harga), courier, tracking_number, created_at, paid_at, shipped_at, delivered_at, expires_at` — bukan seluruh row/payload; email salah → 403; rate limit per IP+order.
  - `cors.ts`: `corsHeadersFor(origin)` — allow hanya `ALLOWED_ORIGINS` (env, dipisah koma) + `localhost:5173`; selain itu tidak ada header CORS.
- Alur `create-order` (server-side, tidak pernah mempercayai harga dari klien): rate limit (`rl:create-order:<ip>`, 10/10 menit) → validasi → ambil varian+produk+harga dari DB (service role) → `computeTotals` (pajak dari `site_settings`, ongkir dari `shipping_zones` berdasar `address.province`; **zona tidak ketemu ⇒ 400 `shipping_unavailable`**) → RPC `create_order(payload, idempotency_key)` → response.

- [ ] **Step 1: Test murni** `cors.test.ts` (origin diizinkan/tidak diizinkan) & jalur `lookup-order` DTO mapping — tulis gagal, run FAIL.
- [ ] **Step 2: Implementasi** ketiga modul shared + dua function.
- [ ] **Step 3: Deploy & uji integrasi**

```bash
npx supabase functions deploy create-order lookup-order --project-ref <ref>
```

`scripts/e2e/create-order.mjs` (pakai service role dari env untuk bersih-bersih): skenario bahagia (2 varian) → 200 + stok `reserved` naik; dobel-submit `idempotency_key` sama → satu order; qty > stok → 409; **guest mencoba membaca pesanan dengan email salah → 403**; `lookup-order` tidak mengembalikan field internal (assert tidak ada `internal_note`/`payload`); CORS dari origin asing → tanpa header allow.

- [ ] **Step 4: Run** `npm test` + `node scripts/e2e/create-order.mjs` — semua PASS.
- [ ] **Step 5: Commit** (`feat(edge): create-order & lookup-order aman + e2e script`)

---

### Task 12: Checkout rework — alamat, ongkir zona, rincian jujur, consent, submit

**Files:**
- Modify: `src/pages/Checkout/Checkout.jsx`, `Checkout.css`, `src/context/OrderContext.jsx`, `src/data/translations.js`, `src/pages/CheckoutSuccess/` → rename `src/pages/OrderReceived/` (ganti konten jadi halaman "Pesanan diterima"), `src/App.jsx` (route `/order-received`)
- Test: `src/pages/Checkout/__tests__/Checkout.test.jsx`

**Interfaces:**
- Consumes: `fetchShippingZones`/`fetchPublicSettings` (Task 6), `POST create-order` (Task 11).
- Produces: alur 2 langkah (Informasi & Pengiriman → Konfirmasi); rincian biaya **sebelum** submit: subtotal, ongkir zona, diskon (0), keterangan "Harga sudah termasuk PPN" (dari settings; tanpa angka pajak terpisah di layar pembeli), total; checkbox **terpisah, tidak pre-ticked**: (1) "Saya setuju Syarat & Ketentuan" (2) "Saya sudah membaca Kebijakan Privasi" — keduanya wajib; versi dokumen dikirim ke `create-order.accepts`; tombol submit nonaktif sampai valid; bila zona ongkir kosong → banner "Toko belum menerima pesanan online" dan submit diblokir (K8). Sukses → navigate ke `/order-received` dengan data order; gagal → tampilkan alasan yang benar (stok habis, ongkir, jaringan).

- [ ] **Step 1: Test gagal** — submit tanpa consent → tidak memanggil API; rincian menampilkan ongkir dari zona; sukses create-order → pindah halaman; 409 insufficient_stock → pesan Indonesia yang jelas.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implementasi** (panggil edge via `fetch`, bukan supabase-js; hapus sisa referensi Xendit/whatsapp-only di file ini; `OrderContext.createOrder` membaca/menulis DB via edge + tetap cache lokal untuk tampilan).
- [ ] **Step 4: Run** — PASS; cek manual: isi form → rincian benar → submit ke staging.
- [ ] **Step 5: Commit** (`feat(checkout): alur checkout 2 langkah, ongkir zona, consent, submit create-order`)

---

### Task 13: Pelacakan, riwayat, & pembatalan oleh pembeli

**Files:**
- Modify: `src/pages/OrderLookup/OrderLookup.jsx`, `src/pages/OrderHistory/OrderHistory.jsx`, `src/context/OrderContext.jsx`, `src/data/translations.js`
- Test: `src/pages/OrderHistory/__tests__/OrderHistory.test.jsx`

**Interfaces:**
- Consumes: `lookup-order` (Task 11), RPC `cancel_order_by_customer` (Task 4), `orders` select-own via RLS.
- Produces: timeline status (menunggu bayar → dibayar → dikemas → dikirim → diterima) + info kurir/resi; tombol **"Batalkan pesanan"** hanya saat `pending_payment` (RPC dengan konfirmasi email/nomor; sukses → status `cancelled`, pesan stok dilepas).

- [ ] **Step 1: Test gagal** — order `pending_payment` menampilkan tombol batal; order `paid` tidak; klik batal memanggil RPC dan menampilkan status baru.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implementasi**.
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** (`feat(orders): lacak, riwayat, & pembatalan mandiri (pra-bayar)`)

---

### Task 14: UX dasar global — scroll, fokus, reduced-motion (murah, menyeluruh)

**Files:**
- Create: `src/components/ScrollToTop/ScrollToTop.jsx`, `src/components/ScrollToTop/__tests__/ScrollToTop.test.jsx`
- Modify: `src/App.jsx` (pasang `<ScrollToTop />` di dalam Router), `src/index.css` (scroll-behavior + focus-visible + guard reduced-motion)

**Interfaces:**
- Produces: perilaku global untuk semua halaman: (a) pindah route → halaman mulai dari atas (instan, bukan smooth, supaya navigasi tidak terasa lambat); (b) klik anchor `#...` yang valid → smooth scroll (dari CSS, hanya saat `prefers-reduced-motion: no-preference`); (c) fokus keyboard selalu terlihat (`:focus-visible` dengan ring token; tidak ada `outline: none` tanpa pengganti); (d) animasi CSS yang ada (slide/fade/scale) meredup untuk pengguna reduced-motion (durasi mendekati 0, bukan dihapus).

- [ ] **Step 1: Test gagal** — render `<ScrollToTop />` di dalam `MemoryRouter`; assert: berpindah pathname memanggil `window.scrollTo` dengan tujuan `top: 0`; berpindah hanya hash tidak memanggil.
- [ ] **Step 2: Run** `npx vitest run src/components/ScrollToTop` — Expected: FAIL.
- [ ] **Step 3: Implementasi** — komponen `ScrollToTop` (`useLocation` + `useEffect`, `window.scrollTo({ top: 0, left: 0, behavior: 'instant' })`); di `src/index.css`: `@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }`, gaya `:focus-visible` global (outline 2px + offset 2px, warna dari token), guard `@media (prefers-reduced-motion: reduce)` untuk animation/transition. Audit singkat `outline: none` di seluruh `src/**/*.css` — ganti dengan gaya focus-visible bila ketemu.
- [ ] **Step 4: Manual check** — Shop → scroll ke bawah → buka produk → halaman mulai di atas; Tab keliling → fokus selalu terlihat; aktifkan "reduce motion" di OS → tidak ada animasi besar.
- [ ] **Step 5: Commit** (`feat(ux): scroll restoration, focus-visible, reduced-motion guard`)

### Task 15: E2E manual, dokumen acceptance, PR Stage 0–1

**Files:**
- Create: `docs/runbook/stage-0-1-acceptance.md`
- Modify: `docs/runbook/00-supabase-setup.md` (tambahkan hasil/link), README (nilai env & perintah baru)

**Interfaces:**
- Consumes: semua di atas.
- Produces: dokumen acceptance berisi skenario & bukti; PR `stage-0-1 → main` untuk direview pemilik.

- [ ] **Step 1:** Tulis `stage-0-1-acceptance.md`: skenario wajib (semua dijalankan agen, hasil dicatat): (1) buka domain → katalog dari DB tampil; (2) pesan 2 item guest → nomor order muncul, stok turun di DB; (3) klik ganda submit → satu order; (4) qty > stok → pesan jelas; (5) lookup dengan email salah → ditolak; (6) batal pesanan pra-bayar → stok kembali; (7) `curl -I /.env` 404; (8) header keamanan terpasang; (9) `npm test` & `npm run lint` hijau; (10) preview deploy PR berjalan.
- [ ] **Step 2:** Catat known issues yang sengaja ditunda (mis. harga di wishlist = snapshot saat ditambahkan; halaman legal belum ada; Home masih menampilkan testimoni karangan — dihapus di Stage 4).
- [ ] **Step 3:** `git push -u origin stage-0-1`; buka PR dengan ringkasan + link evidence; assign pemilik.
- [ ] **Step 4: Commit** (`docs: acceptance Stage 0–1 + known issues`).

---

## Yang TIDAK termasuk Plan 1 (dan akan jadi plan terpisah)

- **Plan 2 (Stage 2):** adapter pembayaran Duitku + jalur transfer manual + upload bukti + webhook + halaman status pembayaran + email transaksional + penghapusan sisa Xendit.
- **Plan 3 (Stage 3):** panel admin lengkap + MFA + notifikasi pemilik.
- **Plan 4 (Stage 4):** halaman legal, consent records, unsubscribe, ekspor/hapus akun, audit copy.
- **Plan 4.5 (Stage 4.5):** desain, motion & kenyamanan (UI/UX overhaul + `DESIGN.md`, sesuai permintaan pemilik) — dikerjakan setelah halaman fungsional & legal selesai, sebelum prerender SEO.
- **Plan 5 (Stage 5):** rate limit menyeluruh, monitoring, backup + restore drill, security sweep 🔴🟠.
- **Plan 6 (Stage 6):** JSON-LD semua schema, sitemap/robots, prerender, konten blog + FAQ.
- **Plan 7 (Stage 7):** go-live QA + runbook operasional.

## Catatan Self-Review (untuk pelaksana)

- Cakupan spec Stage 0–1 ↔ task: fondasi/deploy = T1–T5; katalog DB + seed = T6–T7; pesanan server-side = T4, T10–T12; pelacakan/pembatalan = T13; UX dasar global = T14; acceptance = T15. Store bucket & settings = T4/T7. Gate ongkir kosong = T10 (tolak) + T12 (blokir UI).
- Nama & tipe konsisten: `stock_available` (klien) = `stock_on_hand - stock_reserved` (DB); `expires_at` 24 jam; `idempotency_key` 8–80 char; status enum persis Global Constraints.
- Test Review Focus tersebar: uang/pajak → T10; idempotensi → T11; race stok → T4 Step 5(d); IDOR lookup/cancel → T4 Step 5(e) & T11/T13; RLS bocor → T4 Step 5(c).
