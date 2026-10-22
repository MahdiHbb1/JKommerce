# Acceptance Stage 0–1 — Fondasi, Katalog, Pesanan

Tanggal: 22 Oktober 2026
Branch: `stage-0-1`
Commit kode terakhir: `6a08119` (dokumen ini diperbarui setelah commit kode tersebut)
PR review: https://github.com/MahdiHbb1/JKommerce/pull/1 (terbuka, belum di-merge)
Lingkungan uji lokal: Windows, Node 25 (produksi memakai Node 20 LTS), Vite 6,
Supabase project `janoer-koening` (`qktvhhzniaearlpzbffv`).

## Ringkasan status

| Gate | Status |
|---|---|
| Kode, test, build lokal | **PASS** |
| Alur pesanan lokal (Edge Function + DB) | **PASS** |
| Browser UX katalog/pesanan | **PASS** |
| UI Heritage: shell, Home, kartu, Wishlist/Account copy | **PASS untuk review** |
| Delivery Gate browser (termasuk QuickView 44px) | **PASS** - 57/57 + 18/18 |
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

### 9. `npm test`, `npm run lint`, build, dan Delivery Gate hijau — PASS

- Test: **14 file / 77 test PASS** dalam 85,23 detik memakai `pool: 'threads'`
  (`c6fd17c`) sebelum review-fix. Rerun penuh setelah `6a08119` juga
  **14 file / 77 test PASS** dalam 328,40 detik memakai
  `--pool=forks --maxWorkers=1`; run serial ini dipakai karena memori mesin
  turun ke sekitar 1,3 GB dan worker threads melewati timeout 60 detik. Tidak
  ada assertion gagal.
- Lint: **0 error, 55 warning** (warning lama a11y/unused, bukan regresi).
  Peringatan QuickView lama sudah hilang setelah kontrolnya diberi label.
- Build: `npm run build` **PASS** dalam 15,97 detik (pre-review-fix) dan
  46,86 detik setelah `6a08119` saat mesin kekurangan memori.
- Delivery Gate browser: **57/57 PASS** di 1360x1000 dan 390x844,
  0 console error, 0 page error, 0 overflow horizontal. Audit terarah
  QuickView/search/footer: **18/18 PASS** di kedua viewport, termasuk target
  44px, label kuantitas Indonesia, swatch warna berisi dan berlabel, focus
  trap dan focus return QuickView, state terpilih yang terlihat, surface paper,
  batas field 5,13:1, dan footer/header sama lebar (1216px).
- Browser terakhir: Home, Shop, Cart, cart drawer, footer, detail produk,
  QuickView, pencarian, favorit, checkout gate, Wishlist, Account, desktop
  1360 px dan mobile 390 px. Drawer, menu mobile, dan QuickView bisa ditutup
  dengan Escape; focus-visible terlihat; target ikon header 44px.
- Pencarian: bug crash `toLowerCase` pada data produk tidak lengkap diperbaiki;
  saran pencarian memakai katalog Supabase dengan fallback seed, bisa dipilih
  dengan keyboard, dan menampilkan fallback gambar. Field pencarian sekarang
  44px, radius 2px, paper surface, batas `ink-faint` 5,13:1, dan focus ring
  emas yang tidak menghapus outline global.
- Hardening konten: tidak ada klaim gratis ongkir, PPN 11% hardcode, testimoni
  karangan, label "Terlaris", kontak placeholder, atau tautan footer mati yang
  tampil di storefront; em dash di copy yang terlihat sudah dihapus.
- Bahasa: toggle ID/EN memakai kontras yang benar dan label aksesibel sesuai
  bahasa aktif. Meta statis `index.html` sudah Indonesia; `Shop` memakai
  PageMeta terjemahan.
- UI Heritage: shell, Home, ProductCard, QuickView, footer, dan pencarian
  memakai token paper/ink/brown/gold, Playfair Display + Inter, dan kontrol
  44px. Detail di bagian 11.

Catatan lingkungan: Node 25 di mesin ini sebelumnya gagal membuat worker
Vitest; commit `c6fd17c` mengganti pool ke `threads`, sehingga suite penuh
stabil di sekitar 85 detik saat memori cukup. Pada sesi 22 Oktober malam,
memori turun ke sekitar 1,3 GB; worker threads timeout, lalu suite yang sama
lulus serial dengan `forks` dalam 328 detik. Konfigurasi repo tetap `threads`
untuk CI/normal. CI/produksi memakai Node 20.

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

### 11. UI Foundation dan Home (Stage 4.5A) — PASS untuk review

- Task 1 tokens/font/icon: `8dd3d2d`, fix `801addd`, `bd17003`; review clean.
- Task 2 shell/mobile nav: `88b754c`, fix `b2260bc`; review APPROVED; gate 37/37.
- Task 3 Home/ProductCard: `bb5aa49`, fix `ba950e6`; scoped re-review CLEAN;
  gate 31/31; whole-branch review `READY TO CLOSE`, 0 Critical / 0 Important.
- Bilingual cleanup Wishlist/Account: `59e4685`, `23c0411`, `54bed99`; review
  APPROVED.
- Final polish: `8a86d26` - QuickView 44px dan label Indonesia, SearchBar
  heritage, footer container dan heading, PageMeta Shop, meta statis Indonesia,
  `ink-faint` digelapkan ke 5,13:1.
- Review independen `8a86d26`: **APPROVED**, tanpa Critical/Important.
  Review-fix `6a08119`: focus masuk/terperangkap/kembali di QuickView, swatch
  warna berisi dan berlabel, label favorit stabil, animasi masuk yang
  terdefinisi, outline fokus dipulihkan, batas pencarian 5,13:1, badge mobile
  tidak menutupi tombol tutup.
- Test 77/77 sebelum review-fix dan 77/77 setelah `6a08119` (run serial
  `forks`, 328,40 detik), lint 0 error / 55 warning, build PASS,
  Delivery Gate 57/57, audit QuickView/search/footer 18/18. Semua di
  1360x1000 dan 390x844, 0 console/page error.
- Kontras: ink/paper 16,37:1; ink-soft/paper 7,14:1; ink-faint/paper 5,13:1;
  gold/paper 4,61:1; danger/paper 6,05:1; paper/brown-ink 13,52:1;
  gold-bright/brown-ink 6,87:1; footer muted 7,75:1 dan 5,85:1. Batas field
  pencarian `ink-faint` di paper-raised 5,13:1 (non-teks, ambang 3:1).
- Laporan Delivery Gate lokal (gitignored):
  `.superpowers/sdd/2026-10-20-ui-foundation-home/delivery-gate-report.md`.

Cakupan yang sudah di-restyle: shell, Home, ProductCard, Wishlist, salinan
Account, footer, SearchBar, kontrol QuickView, meta statis. **Belum** di-restyle:
About, NotFound, CheckoutFailed, Checkout/Cart legacy, dan primitive `Button`
Account. Tidak ada toggle tema gelap; identitas kertas hangat adalah keputusan
merek. Uji screen reader nyata belum dilakukan.

Status: **PASS untuk review kode**, bukan klaim produksi. Checkout produksi
tetap sengaja diblokir selama `shipping_zones` kosong dan Edge Functions belum
ter-deploy.

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
- **Kontras UI Heritage**: ink/paper 16,37:1; ink-soft/paper 7,14:1;
  ink-faint/paper 5,13:1; gold/paper 4,61:1; danger/paper 6,05:1;
  paper/brown-ink 13,52:1; gold-bright/brown-ink 6,87:1; footer muted 7,75:1
  dan 5,85:1. Semua pasangan teks normal di cakupan lulus AA. Aksen emas
  non-teks legacy tetap `#8A6A1F` (4,72:1 pada krem).

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
| Foto/deskripsi/harga/stok/nama warna seed belum diverifikasi | Konten masih `needs_verification`; beberapa nama warna masih Inggris (`Navy Blue`, `Soft Purple`); jangan dianggap final | Verifikasi pemilik |
| Harga wishlist = snapshot saat ditambahkan | Harga bisa berbeda dari katalog terkini | Diterima untuk Stage 1 |
| Nomor WhatsApp/akun sosial belum tersedia | Footer tidak menampilkan kontak placeholder; kanal resmi belum ada | Isi dari pemilik |
| Sisa kode Xendit (`create-invoice`) | Tidak dipakai, tidak boleh di-deploy | Dihapus Plan 2 |
| Testimoni karangan di Home | Sudah dihapus (`f774ded`), termasuk label “Terlaris” yang tidak berdasar data | Selesai (melampaui rencana awal Stage 4) |
| Warning lint lama (56) | Tidak memblokir build; sebagian a11y | Stage 4/5 |
| Node 25 flake di mesin lokal | `pool: 'threads'` (`c6fd17c`) normal sekitar 85 detik; saat memori rendah, run serial `forks` 328 detik tetap 77/77 | Selesai untuk review |
| Halaman legacy About/NotFound/CheckoutFailed dan Checkout/Cart | Belum memakai sistem visual Heritage; NotFound masih Inggris dan beberapa gradient lama masih ada | Stage 4/5 cleanup |
| Account memakai primitive `Button` legacy | Tombol belum konsisten dengan token Heritage | Shell polish lanjutan |
| Tidak ada toggle tema gelap | Identitas kertas hangat adalah keputusan merek, bukan toggle rusak | Tambah hanya jika pemilik meminta |
| Uji screen reader nyata belum dilakukan | Semantik/ARIA sudah diuji otomatis dan lewat keyboard | Stage 4/5 |
| Clear-all wishlist tanpa konfirmasi/undo | Risiko hapus tidak sengaja | Polish lanjutan |

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
