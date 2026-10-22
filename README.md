# Janoer Koening Batik

Toko batik premium Janoer Koening. Frontend React + Vite, data katalog dan
pesanan di Supabase, deploy statis di Cloudflare Pages.

Status: **Stage 0–1 (fondasi, katalog, checkout, pelacakan pesanan)**. Situs
belum live; deployment dan data operasional masih menunggu aksi pemilik. Lihat
[`docs/runbook/stage-0-1-acceptance.md`](docs/runbook/stage-0-1-acceptance.md).

## Fitur

- Katalog dari database: pencarian, filter kategori/motif/harga, urutan, dan
  paginasi.
- Detail produk dengan varian ukuran/warna dan stok per varian.
- Keranjang dan wishlist per perangkat; pesanan tamu bisa dilacak dengan nomor
  pesanan + email.
- Checkout dua langkah: informasi/pengiriman → konfirmasi. Ongkir hanya dari
  zona aktif di `shipping_zones`; checkout diblokir bila zona belum diisi.
- Pesanan diproses server-side oleh Edge Function `create-order`: harga, stok,
  pajak, dan ongkir dihitung ulang di server; idempotency mencegah pesanan ganda.
- Riwayat pesanan akun dan pembatalan mandiri sebelum bayar (stok dikembalikan).
- UI bilingual Indonesia/Inggris, fokus keyboard terlihat, dukungan
  `prefers-reduced-motion`.

Belum termasuk di Stage 0–1: pembayaran Duitku/webhook, upload bukti transfer,
email transaksional, halaman legal, panel admin, dan pencatatan bukti consent.
Itu masuk Plan 2–4. **Tidak ada klaim pembayaran otomatis sebelum Plan 2.**

## Stack

- React 18.3 + Vite 5 + React Router 6
- Tailwind CSS 3.4
- Supabase: Postgres, Auth, Storage, Edge Functions (Deno)
- Vitest + Testing Library
- Cloudflare Pages untuk hosting statis

## Menjalankan lokal

Prasyarat: **Node.js 20 LTS** dan npm (paket dikunci dengan
`package-lock.json`).

```bash
npm install
cp .env.example .env
npm run dev
```

Buka `http://localhost:5173`. Tanpa Supabase, halaman katalog menampilkan
status kosong; checkout tidak bisa mengirim pesanan.

## Environment

Frontend (boleh masuk bundle browser, jangan isi secret):

| Variabel | Wajib | Keterangan |
|---|---|---|
| `VITE_SUPABASE_URL` | ya | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ya | anon public key Supabase |
| `VITE_WHATSAPP_NUMBER` | tidak | nomor asli format `62...`; kosongkan bila belum ada |

Script lokal dan Edge Function (jangan commit nilainya):

| Variabel | Dipakai untuk |
|---|---|
| `SUPABASE_DB_URL` | Session pooler URL untuk `supabase db push` dan verifikasi DB |
| `SUPABASE_ACCESS_TOKEN` | Management API untuk seed/verifikasi (token scoped) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | server-side saja; di Supabase hosted sudah tersedia otomatis |
| `ALLOWED_ORIGINS` | daftar origin frontend dipisah koma untuk CORS Edge Function |

Di Supabase, set origin produksi setelah domain ada:

```bash
supabase secrets set ALLOWED_ORIGINS=https://domain-utama,https://www.domain-utama
```

`localhost:5173` selalu diizinkan untuk pengembangan. Wildcard `*` diabaikan.

## Database dan seed

Semua perubahan skema lewat `supabase/migrations/`; jangan edit dashboard.

```bash
# dorong migrasi (butuh SUPABASE_DB_URL)
supabase db push --db-url "$SUPABASE_DB_URL"

# isi katalog awal; idempoten, tidak menimpa produk/gambar/stok yang sudah ada
node scripts/seed-products.mjs

# cek skema, RLS, RPC, stok, idempotency, pembatalan
node scripts/verify-db.mjs
```

Seed menandai konten `needs_verification=true`. Ganti foto, deskripsi, harga,
dan stok hanya setelah pemilik memverifikasi.

## Test dan build

```bash
npm test
npm run lint
npm run build
```

E2E Edge Function lokal tidak memerlukan Docker. Jalankan dua function dengan
Deno, lalu arahkan skrip E2E ke keduanya:

```bash
# terminal 1 — create-order
E2E_PORT=8787 \
E2E_FUNCTION_ENTRY="file:///$PWD/supabase/functions/create-order/index.ts" \
npx --yes deno-bin run --env-file=.env --allow-net --allow-env --allow-read \
  scripts/e2e/serve-function.ts

# terminal 2 — lookup-order
E2E_PORT=8788 \
E2E_FUNCTION_ENTRY="file:///$PWD/supabase/functions/lookup-order/index.ts" \
npx --yes deno-bin run --env-file=.env --allow-net --allow-env --allow-read \
  scripts/e2e/serve-function.ts

# terminal 3
E2E_CREATE_ORDER_URL=http://127.0.0.1:8787 \
E2E_LOOKUP_ORDER_URL=http://127.0.0.1:8788 \
node scripts/e2e/create-order.mjs
```

Di PowerShell, set variabel dengan `$env:E2E_PORT="8787"` dan seterusnya.

## Deploy

Hosting v1: **Cloudflare Pages**, root direktori `batik-ecommerce/`, build
`npm run build`, output `dist/`, `NODE_VERSION=20`. Header keamanan dan SPA
fallback ada di `public/_headers` dan `public/_redirects`.

```bash
# deploy Edge Functions (butuh PAT dengan izin Edge Functions read/write)
supabase functions deploy create-order lookup-order \
  --project-ref qktvhhzniaearlpzbffv
```

Langkah domain dan Pages: [`docs/runbook/01-hosting-domain.md`](docs/runbook/01-hosting-domain.md).

## Dokumentasi

- [`docs/runbook/00-supabase-setup.md`](docs/runbook/00-supabase-setup.md) — setup Supabase.
- [`docs/runbook/01-hosting-domain.md`](docs/runbook/01-hosting-domain.md) — domain dan Cloudflare Pages.
- [`docs/superpowers/specs/2026-10-19-jkommerce-upgrade-design.md`](docs/superpowers/specs/2026-10-19-jkommerce-upgrade-design.md) — keputusan produk/teknis.
- [`DESIGN.md`](DESIGN.md) — arah visual.
- [`docs/runbook/stage-0-1-acceptance.md`](docs/runbook/stage-0-1-acceptance.md) — status acceptance dan blocker.

## Lisensi

Dibuat untuk Janoer Koening Batik.
