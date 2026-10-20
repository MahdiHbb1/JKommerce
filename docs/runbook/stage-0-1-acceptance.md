# Acceptance Stage 0–1 — Fondasi, Katalog, Pesanan

Tanggal: 20 Oktober 2026
Branch: `stage-0-1`
Commit terakhir saat dokumen ini diperbarui: `9d224b9`
PR review: https://github.com/MahdiHbb1/JKommerce/pull/1 (terbuka, belum di-merge)
Lingkungan uji lokal: Windows, Node 25 (produksi memakai Node 20 LTS), Vite 5,
Supabase project `janoer-koening` (`qktvhhzniaearlpzbffv`).

## Ringkasan status

| Gate | Status |
|---|---|
| Kode, test, build lokal | **PASS** |
| Alur pesanan lokal (Edge Function + DB) | **PASS** |
| Browser UX katalog/pesanan | **PASS** |
| Domain produksi, header keamanan live, `/.env` live | **BELUM BISA DIUJI** — hosting belum deploy |
| Submit checkout ke Edge Function produksi | **BELUM BISA DIUJI** — function belum ter-deploy |
| PR + preview deploy | **PR terbuka / preview terkunci** — PR #1 siap direview; preview Vercel terlindungi login, Cloudflare Pages belum terhubung |

Kesimpulan: Stage 0–1 **GO untuk review kode**, **NO-GO untuk go-live** sampai
blokir pemilik di bagian akhir diselesaikan. Tidak ada klaim bahwa toko sudah
menerima pesanan nyata.

## Skenario wajib

### 1. Buka domain → katalog dari database tampil — BLOCKED (live), PASS (lokal)

- Domain belum dibeli/dihubungkan; Cloudflare Pages belum dikonfigurasi.
- Katalog sudah membaca Supabase, bukan `src/data/products.js`. Seed berisi 14
  produk dengan varian, gambar, dan stok.
- Bukti kode: `src/lib/db/catalog.js`, `src/pages/Shop/Shop.jsx`,
  `scripts/seed/products.seed.json`.
- Verifikasi browser katalog ada di evidence Task 8 dan Task 13.

**Sisa aksi:** selesaikan Runbook 01, lalu ulangi skenario ini di domain asli.

### 2. Pesan 2 item sebagai guest → nomor pesanan muncul, stok turun — PASS lokal

Dijalankan dengan dua Edge Function lokal (Deno) + Supabase asli:

- `create-order` → `200`, nomor `JK-20261020-0010`, status
  `pending_payment`.
- Total integer > 0, ongkir sesuai zona uji `Rp20.000`, mode pajak dari
  `site_settings` = `included`.
- Stok tereservasi naik: varian A `+1`, varian B `+2`; order dan item tersimpan
  di DB.
- Data uji dibersihkan dan reservasi stok kembali seperti semula.

Bukti: `npm` E2E run 20 Okt 2026, **27/27 PASS**; skrip
`scripts/e2e/create-order.mjs`.

### 3. Klik ganda submit → satu pesanan — PASS lokal

Dua request dengan `idempotency_key` sama mengembalikan order yang sama; hanya
satu baris order dan satu set reservasi stok. Error yang tidak terduga tidak
membuat order kedua.

### 4. Qty > stok → pesan jelas — PASS lokal

Response `409` dengan kode `insufficient_stock`; UI menampilkan pesan stok tidak
cukup dan tidak membuat pesanan. Stok tidak negatif.

### 5. Lookup dengan email salah → ditolak — PASS lokal

- Email salah → `403` `email_mismatch`.
- Nomor tidak ada → `404` `order_not_found`.
- DTO publik hanya memuat nomor, status, tanggal, item, total, kurir/resi; email,
  alamat, dan field internal tidak dikembalikan.

### 6. Batal pesanan pra-bayar → stok kembali — PASS

`node scripts/verify-db.mjs` → **27/27 PASS**, termasuk:

- pembatalan dengan email salah ditolak;
- pembatalan dengan email benar → status `cancelled`;
- `stock_reserved` kembali 0;
- event pembatalan tercatat.

Pembatalan hanya tersedia untuk `pending_payment`; status terminal lain tidak
menampilkan tombol batal.

### 7. `curl -I /.env` → 404 — BELUM DIUJI LIVE

Pemeriksaan pra-deploy: `dist/.env` **tidak ada**; `.env` masuk `.gitignore` dan
tidak disalin ke `dist/`. Artefak build hanya berisi aset publik, `_headers`,
`_redirects`, `index.html`, manifest, dan service worker.

Setelah deploy, jalankan:

```powershell
curl.exe -I https://<domain>/.env
```

Harus `404`/`410`, bukan `200`.

### 8. Header keamanan terpasang — SIAP, BELUM DIVERIFIKASI LIVE

`public/_headers` berisi:

- `Content-Security-Policy` (default-src self; connect/img Supabase; object-src none)
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` + `frame-ancestors 'none'`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- cache immutable untuk `/assets/*`

Header hanya aktif di Cloudflare Pages, bukan Vite dev. Verifikasi setelah
deploy:

```powershell
curl.exe -I https://<domain>/
```

### 9. `npm test` dan `npm run lint` hijau — PASS

- Test: **69 test PASS**. Run penuh terakhir pada kode `c1389c2` sempat
  menghasilkan 66/69 karena tiga file timeout 5 detik di lingkungan Node 25;
  ketiganya lulus saat dijalankan ulang terpisah dengan `--testTimeout=20000`
  (Checkout 5/5 + OrderHistory 3/3, ProductDetail 6/6). Tidak ada assertion
  yang gagal. Run penuh sebelumnya pada kode yang sama secara fungsional:
  69/69 PASS.
- Lint: **0 error, 63 warning** (warning lama a11y/unused, bukan regresi).
- Build: `npm run build` **OK**.
- Browser terakhir: Home, Shop, Cart, cart drawer, footer, detail produk,
  pratinjau cepat, pencarian, favorit, checkout gate, desktop 1360 px dan mobile
  390 px; 0 console/page error, 0 overflow, target ikon header 44 px, drawer dan
  QuickView bisa ditutup dengan Escape, menu mobile bisa ditutup dengan Escape.
- Pencarian: bug crash `toLowerCase` pada data produk tidak lengkap diperbaiki;
  saran pencarian memakai katalog Supabase dengan fallback seed, bisa dipilih
  dengan keyboard, dan menampilkan fallback gambar.
- Hardening konten: tidak ada klaim gratis ongkir, PPN 11% hardcode, testimoni
  karangan, label "Terlaris", kontak placeholder, atau tautan footer mati yang
  tampil di storefront; em dash di copy yang terlihat sudah dihapus.
- Bahasa: toggle ID/EN memakai kontras yang benar dan label aksesibel sesuai
  bahasa aktif.

Catatan lingkungan: Node 25 di mesin ini kadang gagal membuat worker Vitest
(`Timeout waiting for worker to respond`); rerun dengan `--maxWorkers=1`
memberi hasil stabil. CI/produksi memakai Node 20.

### 10. Preview deploy PR berjalan — SEBAGIAN

- PR #1 sudah terbuka: https://github.com/MahdiHbb1/JKommerce/pull/1
  (review-only, belum di-merge).
- Vercel sudah membuat preview deployment untuk commit `de1c1ea`, tetapi URL
  preview terlindungi Vercel Authentication (dialihkan ke halaman login), jadi
  belum bisa dipakai untuk review publik. Ini bukan Cloudflare Pages.
- Cloudflare Pages belum dihubungkan ke repo, jadi preview publik belum ada.

**Sisa aksi:** hubungkan Cloudflare Pages ke repo, set env produksi, lalu ulangi
skenario 1, 7, 8, dan 10 di URL preview/domain asli. Untuk sementara, review
dilakukan di server lokal `http://127.0.0.1:5173`.

## Bukti tambahan

- **Task 13 browser** (riwayat, pelacakan, pembatalan): 1360×1000 dan 390×844,
  pending/paid, konfirmasi + Escape, lookup, error/retry, empty state, English,
  0 overflow, target sentuh ≥44 px, 0 console/page error.
  `src/.../task-13-evidence/`, harness `task13-browser.py` (lokal).
- **Task 14 browser**: route berubah → `scrollY = 0`; Tab → ring fokus terlihat;
  `prefers-reduced-motion: reduce` → `scroll-behavior: auto`, durasi animasi
  0,00001 s; tanpa reduce → smooth.
- **DB**: `node scripts/verify-db.mjs` → 27/27 PASS.
- **E2E Edge lokal**: 27/27 PASS.
- **Kontras**: teks sekunder 5,37:1; error 7,92:1; success 9,47:1; aksen emas
  non-teks digelapkan ke `#8A6A1F` (4,72:1 pada krem).

## Known issues yang sengaja ditunda

| Isu | Dampak | Rencana |
|---|---|---|
| `shipping_zones` masih kosong | Checkout menampilkan “Toko belum menerima pesanan online”; submit ditolak `shipping_unavailable` | Pemilik mengisi zona/ongkir; admin Stage 3 mempermudah |
| Function belum ter-deploy | Checkout produksi belum bisa submit; lookups produksi belum ada | PAT Edge Functions + deploy + `ALLOWED_ORIGINS` |
| Halaman legal, kebijakan retur, kontak resmi belum ada | Belum layak go-live; consent baru divalidasi, belum disimpan | Stage 4 |
| Bukti consent belum disimpan | `create-order` memvalidasi `accepts`, tetapi `consent_records` dibuat Stage 4 | Stage 4 |
| Pembayaran belum terintegrasi | Preferensi bayar dicatat, tidak ada tagihan/VA/QRIS otomatis, tidak ada upload bukti | Plan 2 (Duitku + manual + webhook) |
| Email transaksional belum ada | Pembeli tidak menerima email otomatis | Plan 2 (Resend) |
| Panel admin belum ada | Pemilik belum bisa kelola produk/pesanan tanpa SQL | Stage 3 |
| Foto/deskripsi/harga/stok seed belum diverifikasi | Konten masih `needs_verification`; jangan dianggap final | Verifikasi pemilik |
| Harga wishlist = snapshot saat ditambahkan | Harga bisa berbeda dari katalog terkini | Diterima untuk Stage 1 |
| Nomor WhatsApp/akun sosial belum tersedia | Footer tidak menampilkan kontak placeholder; kanal resmi belum ada | Isi dari pemilik |
| Sisa kode Xendit (`create-invoice`) | Tidak dipakai, tidak boleh di-deploy | Dihapus Plan 2 |
| Testimoni karangan di Home | Sudah dihapus (`f774ded`), termasuk label “Terlaris” yang tidak berdasar data | Selesai (melampaui rencana awal Stage 4) |
| Warning lint lama (65) | Tidak memblokir build; sebagian a11y | Stage 4/5 |
| Node 25 flake di mesin lokal | Test bisa timeout saat worker gagal | Pakai Node 20 / `--maxWorkers=1` |

## Blokir pemilik (urut prioritas)

1. **PAT Supabase dengan izin Edge Functions read/write.**
   Deploy sekarang gagal `403 Missing required permission(s): edge_functions_read`.
   Setelah PAT ada:
   `supabase functions deploy create-order lookup-order --project-ref qktvhhzniaearlpzbffv`
   lalu set `ALLOWED_ORIGINS` ke domain produksi.
2. **Zona & tarif ongkir** (provinsi/kota, tarif, aktif/tidak). Tanpa ini checkout
   sengaja diblokir.
3. **Domain + Cloudflare Pages** (beli domain, pindah nameserver, hubungkan repo,
   env `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WHATSAPP_NUMBER`).
4. **Data legal & operasional**: nama badan usaha, NPWP/status PKP, alamat,
   kebijakan retur, rekening bank/QRIS, nomor WhatsApp asli, akun Duitku/Resend.
5. **Cloudflare Pages + preview deployment** untuk PR #1. PR sendiri sudah
   terbuka dan menunggu review; jangan merge sebelum preview/checklist selesai.

Sampai lima hal di atas selesai, status rilis tetap **belum live** dan tidak boleh
diklaim menerima pesanan.
