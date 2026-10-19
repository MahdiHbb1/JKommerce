# Dokumen Desain: JKommerce — Dari Demo jadi Toko Batik yang Beneran Jalan

- **Tanggal:** 19 Oktober 2026
- **Repo:** `batik-ecommerce` (github.com/MahdiHbb1/JKommerce), branch `main`
- **Pemilik:** Mahdi (operator tunggal — semua pesanan, verifikasi pembayaran, dan pengiriman dijalankan sendiri)
- **Status:** draft untuk review pemilik sebelum dibuat rencana kerja (implementation plan)

---

## 0. Ringkasan Keputusan

Keputusan yang sudah disepakati bersama pemilik:

| # | Keputusan | Alasan |
|---|---|---|
| K1 | Yang di-upgrade hanya `batik-ecommerce`. Situs statis di root repo (`index.html`, `products.html`, `gallery.html`, `js/`, `images/`) di luar cakupan — dibiarkan sebagai arsip | Pemilik memilih aplikasi React yang sudah punya cart/checkout/backend |
| K2 | **Xendit dibatalkan.** Gateway diganti **Duitku** + **jalur transfer manual** sebagai cadangan | Xendit tidak pernah sampai deploy; pemilik ingin ganti |
| K3 | Operator tunggal → wajib ada **panel admin** sederhana (orders, stok, verifikasi bayar, resi). Tidak mengandalkan dashboard Supabase mentah | Supabase dashboard terlalu teknis untuk operasional harian |
| K4 | Pemilik sudah punya akun Supabase (belum ada organization/project). Project akan dibuat saat Stage 0 | — |
| K5 | Domain belum dimiliki (`janoerkoening.com` terdaftar oleh orang lain 2 Okt 2026 — bukan milik pemilik). Domain akan dibeli | Lihat §5.8 untuk kandidat |
| K6 | Kerangka kerja: checklist `checklist-legal-backend-security-app.md` diterapkan; schema markup `20-schema-ecommerce.md` diterapkan sebanyak yang datanya nyata | Permintaan langsung pemilik |
| K7 | **Pajak: pemilik menyatakan status PKP** → PPN ditampilkan (mode "harga sudah termasuk PPN", tarif & NPWP dikonfigurasi di pengaturan situs). Status & tarif berlaku **diverifikasi ulang saat setup**; kalau ternyata bukan PKP, cukup satu toggle di pengaturan | Jawaban pemilik; jangan hardcode — aturan pajak berubah dan status bisa berubah |
| K8 | **Ongkir: tarif ditunda** (belum diputuskan). Situs berangkat **tanpa klaim gratis ongkir apa pun**; tarif zona wajib diisi di pengaturan sebelum go-live — checkout diblokir (mode pra-launch) selama tarif kosong | Jawaban pemilik + anti-goal "biaya tersembunyi" |
| K9 | **Model stok: SKU berulang per ukuran/warna** (bukan keping unik) | Jawaban pemilik; menyederhanakan `product_variants` & mengaktifkan schema `ProductGroup` |

Keputusan yang **saya** (perancang) ambil dan pemilik boleh bantah — lihat §9.2:

| # | Pilihan saya | Alasan singkat |
|---|---|---|
| B1 | Hosting di **Cloudflare Pages** (gratis, boleh komersial) dengan DNS di Cloudflare; alternatif Netlify Starter. **Bukan Vercel Hobby** karena ToS-nya membatasi pemakaian non-komersial | Toko ini komersial; repo sudah punya `vercel.json` yang tinggal diterjemahkan ke `_headers`/`_redirects` |
| B2 | Tetap SPA React + **prerender saat build** untuk halaman penting (Stage 6), bukan migrasi ke Next.js sekarang | Menjaga momentum launch; JSON-LD tetap muncul di HTML mentah untuk crawler |
| B3 | Produk pindah dari `src/data/products.js` ke tabel Supabase (`products` + `product_variants`), gambar ke Supabase Storage | Tanpa ini, stok/tombol sold-out tidak bisa jujur dan pemilik tidak bisa kelola sendiri |
| B4 | Rendering JSON-LD dibungkus modul builder tunggal (`src/lib/schema/`) yang membaca data yang sama dengan UI | Prinsip no.1 file schema: markup harus sama dengan yang tampil |
| B5 | Analytics: **Plausible opsional (cookieless)** atau tanpa analytics dulu; tidak ada pixel iklan di v1 | Menghindari kebutuhan cookie consent banner yang rumit sekaligus tetap patuh |
| B6 | Font Playfair Display + Poppins **self-host** (lisensi OFL); saat ini dideklarasikan di CSS tapi tidak pernah dimuat — jadi tampilan sekarang memakai fallback font | Checklist #19 (lisensi aset) + #8 (kurangi pihak ketiga) |
| B7 | Tidak ada fitur AI di aplikasi ini → seluruh blok "Fitur AI" di checklist (prompt injection, biaya AI, dll.) **N/A**, dicatat alasannya | Tidak dikarang-karang demi kelengkapan |
| B8 | Sesi Supabase tetap di localStorage (default SPA) dengan mitigasi CSP ketat; pindah ke cookie HttpOnly dicatat sebagai risiko yang diterima, ditinjau ulang kalau ada SSR | Alternatifnya BFF/SSR penuh yang menunda launch; lihat §5.10 |

---

## 1. Latar & Tujuan

**Sekarang:** JKommerce adalah aplikasi e-commerce batik yang lengkap di sisi tampilan (katalog, filter, cart, wishlist, checkout multi-step, order lookup, auth) tapi belum pernah "hidup": tidak ada Supabase project, tidak ada `.env`, tidak ada domain, tidak ada gateway pembayaran yang jalan. Pesanan tanpa konfigurasi hanya tersimpan di `localStorage` browser **pengunjung** — artinya pemilik tidak akan pernah melihatnya. Beberapa konten juga belum jujur: testimoni karangan, newsletter yang pura-pura sukses tanpa backend, nomor WhatsApp dan akun sosial placeholder.

**Setelah upgrade:** situs yang bisa menerima pesanan dan uang sungguhan, stok yang jujur, pemilik bisa menjalankan seluruh operasi harian dari satu panel admin, konten legal lengkap dan akurat, keamanan diperkeras sesuai checklist, serta markup schema yang memenuhi syarat AI/search engine — di atas domain milik sendiri.

**Kenapa sekarang:** pemilik siap menjalankan bisnisnya sendiri, dan blokir teknis terakhir (pembayaran) sudah punya jalan keluar (Duitku + manual).

**Definisi sukses:** pembeli pertama bisa menyelesaikan pesanan end-to-end (pilih produk → bayar via Duitku atau transfer manual → pemilik verifikasi → paket dikirim → status update), tanpa pemilik perlu menyentuh kode atau dashboard teknis.

---

## 2. Cakupan

**Goals (v1):**
1. Backend nyata: katalog + varian + stok dari Supabase, pesanan tersimpan server-side.
2. Pembayaran: Duitku (hosted redirect) + transfer manual dengan upload bukti & verifikasi admin.
3. Panel admin untuk operasional harian (pesanan, pembayaran, stok, resi, konten dasar, pengaturan situs).
4. Legal & trust: Privacy Policy, Syarat & Ketentuan, Kebijakan Retur/Refund, Cookie Policy, FAQ, halaman Kontak/About dengan data bisnis nyata; consent yang benar-benar tersimpan; unsubscribe; hapus/ekspor akun; hapus semua konten palsu.
5. Keamanan sesuai prioritas checklist (🔴 wajib sebelum launch, 🟠 minggu pertama) + hardening lanjutan di stage akhir.
6. SEO & markup: JSON-LD per halaman dari data nyata, sitemap, robots, prerender, blog + FAQ bertenaga konten asli.
7. UI/UX: perbaikan menyeluruh pada alur beli (mobile-first), aksesibilitas WCAG dasar, font yang benar-benar dimuat, empty/error states yang rapi.

**Non-goals (v1 — sengaja ditunda):**
- Migrasi framework (Next.js/SSR penuh), aplikasi mobile, multi-currency, multi-bahasa selain id/en yang sudah ada.
- Modul ulasan produk (review) — direncanakan post-launch karena butuh pembeli nyata dulu (baru setelah itu schema Review/AggregateRating sah).
- Kupon/diskon, integrasi kurir live (RajaOngkir dsb.), pengiriman internasional, modul grosir/reseller (B2B) — daftar backlog §8 Stage 7+; B2B bisa masuk kalau pemilik konfirmasi (§9.1 no.7).

**Anti-goals (kalau terjadi, proyek ini gagal walaupun "jalan"):**
- Ada klaim, rating, testimoni, atau data bisnis palsu di produksi.
- Biaya tersembunyi (ongkir/pajak baru muncul di akhir), dark pattern, atau sulit membatalkan pesanan.
- Uang masuk tapi pesanan tidak terlihat/tidak diproses; stok tidak akurat.
- Secret bocor, panel admin terbuka, data pembeli bocor.
- Markup schema yang menyimpang dari isi halaman.

---

## 3. Kondisi Saat Ini (hasil audit kode)

**Yang sudah bagus:**
- Struktur React + Vite + Tailwind rapi; route sudah lazy-loaded; i18n id/en lengkap; aksesibilitas dasar sudah disentuh beberapa ronde sebelumnya.
- Supabase client + `AuthContext`, tabel `orders`, `cart_items`, `wishlist_items` + migration sudah ada; `lookup-order` Edge Function sudah pakai service role dengan benar dan cek kecocokan email.
- `vercel.json` sudah memuat header keamanan dasar (CSP, HSTS, XFO, Referrer-Policy, Permissions-Policy) — tinggal diterjemahkan ke platform hosting terpilih.
- Migration sudah pernah menambal RLS berbahaya (`using (true)` dihapus).

**Masalah & temuan yang harus dibereskan (bukti di kode):**
1. Order guest tanpa Supabase → `localStorage` pengunjung (OrderContext.jsx); dan kebijakan RLS masih mengizinkan `insert` anonim langsung ke tabel `orders` — spam/forgery mungkin.
2. Policy update `orders` mengizinkan pemilik baris meng-update **status apa pun** — celah logika bisnis (#57): pembeli bisa menandai pesanannya `paid` sendiri (setelah dijadikan sumber status).
3. `lookup-order` mengembalikan seluruh row `orders` (termasuk `payload`) — perlu dipangkas (#65).
4. Edge Functions memakai CORS `Access-Control-Allow-Origin: *` — perlu dikunci ke domain sendiri (#27).
5. Testimoni karangan di Home (3 kutipan + nama + bintang 5) — melanggar #11 dan bertentangan dengan prinsip file schema.
6. Newsletter hanya simulasi (`// Simulate subscription (no backend)`) — janji palsu + tidak ada mekanisme unsubscribe (#18).
7. Footer: link `instagram.com` generik dan `wa.me/6281234567890` placeholder (#12/#16 — data kontak harus nyata atau dihapus).
8. Font `Playfair Display`/`Poppins` dikutip di belasan file CSS tapi **tidak dimuat di mana pun** — tampilan tidak sesuai desain; tidak ada CORS/CDN font saat ini.
9. Tidak ada JSON-LD, sitemap, robots, canonical, atau prerender sama sekali (SPA murni).
10. Tidak ada rate limiting, monitoring, backup, audit log, atau test apa pun.
11. Belum ada halaman legal apa pun; belum ada pencatat consent; tidak ada alur hapus/ekspor data.
12. Sisa pekerjaan Xendit (3 Edge Function, halaman success/failed, env, terjemahan) — sesuai K2 akan dibongkar dan diganti adapter.
13. `CREATE`-an Xendit belum di-commit (still working tree) — perlu dirapikan saat Stage 0/2 supaya history mencerminkan kenyataan (hapus, bukan tinggalkan zombie).
14. **Checkout menagih baris "Pajak (PPN 11%)" hardcoded** (`Checkout.jsx`) → direvisi jadi mode pajak yang dikonfigurasi (K7: PKP, harga termasuk PPN, tarif & NPWP dari pengaturan). Sekaligus copy gratis ongkir **saling bertentangan** di file yang sama ("semua pesanan" vs ">Rp 100.000" vs catatan ≥Rp 1.000.000) → **semua klaim gratis ongkir dihapus** sampai pemilik memutuskan tarif (K8, §9.1 no.3).
15. **Halaman produk menampilkan 3 ulasan karangan + rata-rata rating per produk dan form "tulis ulasan" yang tidak menyimpan ke mana pun** (`ProductDetail.jsx` + localStorage) — ikut masuk daftar hapus Stage 4; setelah modul review asli dibangun (post-launch), baru boleh ada bintang/ulasan di UI maupun markup.

---

## 4. Constraint & Asumsi

- **Empat constraint utama:** (1) stack tetap React 18 + Vite + Tailwind + Supabase (B2), (2) operator tunggal non-teknis → semua alur operasional wajib lewat UI admin berbahasa Indonesia, (3) budget: layanan gratis (Supabase Free, Cloudflare Pages Free, Resend Free 100 email/hari) + domain ±Rp150–300rb/tahun + fee transaksi Duitku; biaya berbayar hanya kalau disetujui pemilik, (4) pemilik tidak punya badan usaha berbadan hukum (asumsi — dikonfirmasi di §9.1) → pilih layanan yang menerima perorangan.
- **Asumsi:** pembeli utama Indonesia (Rupiah, alamat Indonesia, ongkir domestik); bahasa utama Indonesia dengan toggle English; pemilik bisa membalas WhatsApp pembeli pada jam wajar.
- **Ketergantungan eksternal:** pembuatan akun & verifikasi Duitku, pembelian domain, dan pengisian data bisnis **dilakukan pemilik** (dipandu langkah demi langkah oleh builder). Semua kredensial masuk lewat Supabase secrets / environment platform, tidak pernah ke repo.

---

## 5. Keputusan Arsitektur

### 5.1 Bentuk aplikasi

SPA React seperti sekarang (routing, contexts, halaman) — **tidak ada migrasi framework**. Yang berubah: sumber data (dari file statis → Supabase), lapisan uang (Edge Functions + adapter pembayaran), panel admin baru, dan tahap prerender untuk SEO. Semua logika bisnis uang berpindah ke server (Edge Functions + fungsi Postgres); browser tidak pernah lagi menghitung atau menetapkan harga/status.

### 5.2 Lapisan pembayaran

**Prinsip:** UI checkout tidak tahu detail provider; ia memanggil satu kontrak adapter.

```
Order dibuat (create-order, server) ──► totals dihitung server dari DB
        │
        ├─ metode "manual"  → return instruksi transfer (dari site_settings) + halaman upload bukti
        └─ metode "duitku"  → adapter Duitku buat halaman pembayaran (redirect) + callback webhook
```

- **Adapter:** `supabase/functions/_shared/payments/{contract.ts, duitku.ts, manual.ts}` — fungsi `createPayment(order)` → `{ redirectUrl | instructions, paymentRef }`, dan `handleCallback(payload)` → hasil status ternormalisasi.
- **Duitku:** alur hosted/redirect (VA, QRIS, e-wallet, retail). Callback diverifikasi dengan **signature resmi Duitku** (melibatkan `merchantCode`, `amount`, `merchantOrderId`, API key) menggunakan perbandingan timing-safe; **detail parameter & rumus signature mengikuti dokumentasi Duitku saat implementasi** (jangan dari ingatan — checklist #38/#62: verifikasi sebelum pakai). Sandbox dulu, live setelah akun diverifikasi.
- **Manual:** halaman instruksi (rekening & QRIS dari `site_settings`), pembeli upload bukti (jpg/png/pdf ≤5MB, disimpan privat di Storage), status `menunggu_verifikasi`, pemilik memverifikasi dari panel admin (satu klik: valid → `paid`, tidak valid → tolak + pesan).
- **Xendit dibongkar total:** hapus `create-invoice`, `xendit-webhook`, referensi di Checkout/translations/env. Halaman `/checkout/success` & `/checkout/failed` dipertahankan tapi digeneralisasi (polling status via `lookup-order`, **tidak pernah** mempercayai redirect URL sebagai bukti bayar — #32).
- **Anti-replay & idempotensi (#59):** setiap callback dicatat di `webhook_events` dengan kunci unik event; pemrosesan bersifat idempoten; update status memakai transisi state machine (§5.4).

### 5.3 Model data (Supabase)

Tabel baru/perubahan (detail kolom final diserahkan ke builder, tapi tabel & peran ini tetap):

| Tabel | Fungsi | Catatan penting |
|---|---|---|
| `products` | Katalog | slug unik, harga, deskripsi, heritage, berat gram, `is_active/featured`, `sort_order` |
| `product_variants` | SKU per ukuran/warna | `stock_on_hand`, `stock_reserved`, `sku` unik — dasar kejujuran stok & schema `ProductGroup` |
| `orders` (+ perluas) | Pesanan | `order_number` unik format `JK-YYYYMMDD-XXXX`; snapshot item; subtotal/ongkir/diskon/**pajak**/total (pajak = nilai yang terkandung/terhitung sesuai mode K7); `status` terbatas enum; `expires_at`; kurir & resi; `customer` fields |
| `order_items` | Baris item + snapshot nama/harga saat beli | Tanpa ini laporan & stok sulit diaudit |
| `order_events` | Audit trail transisi status & aktor (#42) | siapa (system/user/admin), kapan, dari → ke |
| `payments` | Per-order payment record | `provider('manual'\|'duitku')`, `provider_ref` (unik), `method`, `amount`, `status`, `proof_path`, `verified_by/at` |
| `webhook_events` | Anti-replay callback (#59) | `event_key` unik, payload mentah, processed_at |
| `stock_movements` | Jejak stok (reserve/release/sale/restock/adjust) | Menjawab "kok stoknya beda?" |
| `newsletter_subscribers` | Ganti newsletter palsu | status + `unsubscribe_token` + versi consent |
| `consent_records` | Bukti persetujuan (#2/#6) | tujuan terpisah, versi dokumen, timestamp, IP/UA |
| `content_posts` | Blog (untuk "aktif dengan konten" + schema BlogPosting) | markdown, status draft/publish |
| `faqs` | FAQ page + schema FAQPage | bisa diedit admin |
| `site_settings` | Data bisnis, rekening/QRIS manual, zona ongkir, parameter retur | **satu sumber** untuk footer, halaman legal, checkout, dan schema Organization |
| `shipping_zones` | Zona ongkir & estimasi hari | Sumber `OfferShippingDetails` + perhitungan checkout |
| `data_requests` | Permintaan hapus/ekspor (opsional kalau self-service penuh) | #20 |

**Aturan uang (berlaku di semua tabel & UI):** yang tampil = yang dibayar. Harga di katalog & `Offer` = harga yang benar-benar dibayar pembeli. **Pajak (K7):** mode default `included` — harga katalog sudah termasuk PPN; checkout menampilkan keterangan "termasuk PPN" + rincian di nota/email (NPWP dari `site_settings`); tarif & mode (`included` / `excluded` / `none`) adalah pengaturan, bukan konstanta; semua perhitungan di server. **Tanpa biaya tersembunyi:** ongkir (dari `shipping_zones`) tampil lengkap sebelum tombol bayar; fee gateway diserap penjual. **Kalau `shipping_zones` masih kosong, checkout menolak transaksi** (mode pra-launch) — tidak boleh ada pesanan yang bayar tanpa ongkir jelas (K8).

**Aturan RLS (ringkas):**
- `orders`: tidak ada policy insert anonim — semua penulisan lewat Edge Function service-role. Pembeli login hanya bisa `select` pesanannya sendiri; lookup guest lewat Edge Function (dipangkas field-nya).
- Transisi `orders.status` tidak pernah dari client; hanya fungsi server (`SECURITY DEFINER`) yang memvalidasi state machine.
- Admin = `app_metadata.role='admin'` + helper SQL `is_admin()`; policy admin khusus tabel operasional; **MFA (TOTP Supabase) wajib** untuk akun admin (#55).
- Storage: `product-images`, `content-images` publik-read; `payment-proofs` **privat** (akses via signed URL untuk admin).

### 5.4 State machine pesanan & stok

```
draft → pending_payment → paid → packing → shipped → delivered
              │              │
              ├→ expired     └→ refunded (manual oleh admin)
              └→ cancelled
```

- **Stok direservasi saat order dibuat** (atomik, satu statement — pola `UPDATE ... WHERE stock_on_hand - stock_reserved >= n RETURNING`), dilepas saat `expired`/`cancelled`, dikonversi jadi penjualan saat `paid` (dua-duanya tercatat di `stock_movements`) — jawaban untuk #58 race condition.
- **Pembatalan (keputusan B10):** pembeli boleh membatalkan sendiri **hanya selama `pending_payment`** (tautan di halaman pesanan + email); stok dilepas otomatis. Setelah dibayar, pembatalan lewat admin + mengikuti kebijakan retur/refund (anti-goal "sulit membatalkan" tetap terjaga karena state awal selalu bisa dibatalkan sendiri).
- **Model stok (K9):** **SKU berulang per ukuran/warna** — tiap kombinasi punya SKU + stok sendiri di `product_variants`; produk = payung varian (langsung nyambung ke schema `ProductGroup`). Mode "keping unik" tetap didukung skema kalau nanti ada produk one-off, tapi bukan default.
- Kedaluwarsa: `expires_at` 24 jam untuk manual (transfer bank makan waktu) dan mengikuti `expiry_period` Duitku untuk gateway; job terjadwal (`pg_cron` atau cron Edge Function) membatalkan & melepas stok (#57).
- Idempotensi: `create-order` menerima kunci idempotensi dari client untuk mencegah dobel-submit (double-click / retry jaringan).

### 5.5 Panel admin (fitur minimum)

Satu route `/admin` (login + MFA; UI berbahasa Indonesia; boleh tidak bilingual; **dioptimalkan untuk ponsel** — operator tunggal bekerja dari HP, jadi verifikasi bukti bayar, edit stok, dan input resi wajib nyaman di layar kecil, keputusan B11):

1. **Pesanan** — daftar + filter status; detail: item, alamat, bukti bayar (tampil inline), tombol aksi: verifikasi/tolak bayar, input kurir + resi, ubah status, catatan internal.
2. **Produk** — CRUD produk & varian, edit stok (dengan alasan), tandai featured, unggah gambar (otomatis dioptimasi), aktif/nonaktif.
3. **Konten** — tulis/edit artikel blog & FAQ (markdown), publish/unpublish.
4. **Pengaturan** — data bisnis (nama legal, NPWP, kontak, sosial), **mode & tarif pajak (K7)**, rekening + QRIS manual, zona & tarif ongkir, parameter kebijakan retur.
5. **Langganan & kepatuhan** — daftar subscriber + ekspor, catatan consent, permintaan hapus/ekspor data pembeli (lihat §5.9), log audit ringkas.
6. **Ringkasan** — kartu: pesanan baru, menunggu verifikasi, perlu dikirim, omzet bulan berjalan.

### 5.6 Notifikasi

- **Email transaksional** via **Resend** (free 100/hari): konfirmasi pesanan ke pembeli (berisi ringkasan + instruksi bayar/link), email "pembayaran diterima", "pesanan dikirim (+resi)". Domain pengirim memakai domain sendiri (verifikasi DNS). Kalau volume nanti >100/hari, opsi upgrade disebutkan.
- **Pemberitahuan pemilik:** email ke alamat pemilik untuk setiap pesanan baru & pembayaran terverifikasi. WhatsApp API berbayar (Fonnte dsb.) dicatat sebagai opsi nanti — v1 cukup email + lonceng di panel admin.
- **Unsubscribe (#18):** tautan satu-klik (token, endpoint publik tanpa login) untuk semua email yang kita kirim. **Cakupan newsletter di v1 (keputusan B12): situs mengumpulkan langganan + menyediakan unsubscribe yang benar-benar bekerja, tapi TIDAK membangun editor kampanye.** Pengiriman pengumuman dilakukan pemilik lewat Resend dengan template yang disiapkan di runbook; autentikasi SPF/DKIM domain diatur sekali. Kuota email transaksional (pesanan) dipisahkan dari kampanye supaya email uang tidak pernah ketahan karena blast. Campaign composer (kalau perlu) masuk backlog pasca-launch.

### 5.7 SEO, rendering & konten

- **JSON-LD builder** (`src/lib/schema/`): satu fungsi `graph(...nodes)` + sub-builder per tipe (organization, productPage, shopListing, blogPost, faq, policyPage, breadcrumb). Semua nilai dibaca dari data yang sama dengan UI (tidak ada angka hardcode). Escape `<` → `\u003c` (#anti-XSS di file schema).
- **Breadcrumb navigation yang benar-benar tampil** ditambahkan di halaman produk/kategori/blog/kebijakan (syarat schema #16).
- **Prerender saat build** (Stage 6) untuk rute: `/`, `/shop`, `/product/:slug`, `/about`, `/faq`, `/blog`, `/blog/:slug`, halaman kebijakan. Verifikasi: "View Source" harus memuat JSON-LD; lolos Rich Results Test & validator.schema.org.
- **Kesegaran prerender (keputusan B13):** supaya `availability`/harga di HTML mentah tidak berbohong setelah pemilik mengedit dari admin, build ulang dipicu otomatis: (a) tombol "terbitkan" untuk konten, dan (b) **DB trigger pada perubahan stok/harga/produk → memanggil deploy hook hosting** (target: tercermin dalam hitungan menit). Pengguna manusia tetap melihat data live karena aplikasi men-refresh dari DB setelah hydrate; yang dijamin "tidak basi" adalah sinyal crawlernya. Di runbook dicatat: kalau build gagal, notifikasi ke pemilik + halaman tetap versi terakhir yang sah.
- **sitemap.xml & robots.txt** digenerate saat build dari data Supabase; canonical + meta per halaman (komponen `PageMeta` sudah ada, akan digenralkan).
- **Konten awal** (draft oleh builder, direview pemilik — wajib asli, bukan karangan): 6–8 artikel (mis. "Batik Tulis vs Cap vs Printing", "Makna Motif Parang", "Cara Merawat Batik Tulis", "Panduan Ukuran", "Kisah Janoer Koening" — butuh input pemilik), ~10 FAQ nyata (ongkir, retur, ukuran, perawatan, metode bayar, custom order).
- **Bahasa konten (keputusan B9):** UI tetap bilingual id/en seperti sekarang; **konten dari DB** (produk, artikel, halaman legal, email) berbahasa Indonesia dulu di v1, dengan struktur kolom terjemahan yang siap diisi (mis. `name_en` opsional) — biar tidak ada terjemahan setengah jadi yang bisa lolos ke produksi. Versi EN penuh masuk backlog pasca-launch.
- Kalau konten belum siap saat launch, schema terkait (BlogPosting/Person) **tidak dipaksakan** — dipasang saat artikel benar-benar terbit.

### 5.8 Domain & hosting

- **Domain (dibeli pemilik; dibantu langkahnya).** `janoerkoening.com` sudah dipakai orang lain; kandidat (hasil cek awal 19 Okt 2026 — **status final wajib dicek lagi di registrar saat pembelian**):
  - `janoerkoeningbatik.com` — cek RDAP: tidak terdaftar (kemungkinan tersedia). **Rekomendasi utama.**
  - `janoerkoening.id` — status belum bisa dipastikan dari sini; cek di registrar .id.
  - Alternatif fallback: `janoerkoeningbatik.id`, `batikjanoerkoening.com`.
- **Registrar:** Rumahweb atau Namecheap (pembayaran IDR/lokal) — builder memandu; DNS dikelola di **Cloudflare** (gratis; proxy, TLS, rate-limit dasar).
- **Hosting:** **Cloudflare Pages** (gratis untuk pemakaian komersial, deploy dari GitHub, preview per branch) — alternatif Netlify Starter. `vercel.json` yang ada diterjemahkan ke `_headers` + `_redirects` (SPA fallback + header keamanan yang sudah ada).
- **Environment:** URL Supabase, anon key, Resend key (hanya di Edge Function secrets), Duitku key (Edge Function secrets), URL redirect. Production & preview dipisah; tidak ada secret ber-prefix `VITE_` kecuali yang memang publik (URL/anon key).

### 5.9 Legal & consent (penerapan checklist Bagian 1)

| # | Item | Rencana konkret |
|---|---|---|
| 1 | Privacy policy | Halaman nyata yang cocok dengan perilaku app (daftar data: nama, email, telepon, alamat kirim, data pesanan; pihak ketiga: Supabase, Cloudflare, Duitku, Resend). Kontak pemilik data + tanggal update. Draf oleh builder, **wajib direview pemilik** (bukan nasihat hukum) |
| 2 | Syarat & Ketentuan | Halaman + **clickwrap** di checkout (checkbox "saya setuju", tidak pre-ticked), tersimpan di `consent_records` (versi dokumen + waktu) |
| 3 | Refund policy | Halaman retur/refund + konsisten di checkout + `MerchantReturnPolicy` di schema; pengembalian dana mengikuti total yang dibayar **termasuk pajak** (K7). **Angka & syarat adalah keputusan pemilik (§9.1 no.2)** |
| 4 | Cookie policy | Halaman; v1 hanya cookie esensial (sesi) + opsional Plausible cookieless → tanpa banner consent non-esensial. Kalau nanti ada analytics/pixel baru → banner + blocker (didokumentasikan) |
| 5 | Cookie consent banner | **Tidak dipasang di v1** karena tidak ada tracker non-esensial (keputusan B5). Kalau tool baru masuk, banner wajib + skrip diblokir sebelum consent |
| 6 | Consent form | Checkbox terpisah: setuju S&K, setuju kebijakan privasi, berlangganan promo (opsional, terpisah); tidak ada bundling; bukti tersimpan |
| 7 | Minimisasi data | Form checkout hanya minta yang perlu untuk kirim paket (nama, email, telepon, alamat, catatan). Tidak ada KTP/tanggal lahir |
| 8 | Audit SDK pihak ketiga | Daftar v1: Supabase, Cloudflare, Duitku, Resend (+ Plausible opsional). Tidak ada font/CDN eksternal setelah self-host (B6). Daftar ini masuk Privacy Policy |
| 9–12 | Dark pattern, biaya tersembunyi, review palsu, klaim tak berbukti | Hapus 3 testimoni karangan; audit seluruh copy marketing (angka, "terbaik", "100%", jumlah pelanggan) → dihapus/diganti versi jujur; total harga (barang+ongkir) tampil sebelum tombol bayar; tidak ada countdown palsu |
| 13–15 | Alt text, kontras, keyboard | Pass aksesibilitas: alt deskriptif untuk gambar produk (dari data), kontras ≥4.5:1 (audit warna tombol/teks), navigasi keyboard penuh termasuk modal & dropdown, skip link, fokus terlihat |
| 16 | Detail bisnis | Nama, kota/alamat publik (kalau pemilik mau publikasi), email, telepon/WA di footer + halaman kontak + schema Organization. **Data nyata dari pemilik (§9.1 no.1)** |
| 17 | Age (data anak) | Batas usia di S&K (18+/atau dengan izin orang tua); tanpa age gate rumit karena konten dewasa umum |
| 18 | Unsubscribe | Satu-klik via token + `List-Unsubscribe` (Resend mendukung); transaksional bebas promosi |
| 19 | Lisensi aset | Font self-host (OFL); gambar produk = milik pemilik (dimverifikasi §9.1 no.5); gambar dekoratif/ilustrasi ditinjau satu-satu; dependensi via `license-checker` dicatat |
| 20 | Hapus & ekspor data | **Pembeli login:** self-service di halaman Akun (ekspor JSON + hapus akun via Edge Function, anonimisasi; record transaksi yang wajib disimpan dipertahankan tanpa data pribadi berlebih; dijelaskan di policy). **Pembeli guest (keputusan B15):** form permintaan publik (email + nomor pesanan) → verifikasi lewat tautan email → masuk antrean `data_requests` yang diproses pemilik dari panel admin. Saat pendaftaran akun, pesanan lama dengan email sama otomatis tertaut (`orders.user_id`) supaya hak ini berlaku penuh. Pihak ketiga yang dibersihkan: Resend (kontak), Supabase (cascade) — checklist di runbook |

### 5.10 Keamanan (peta checklist Bagian 3)

**Kerjakan per prioritas checklist (bagian 4), bukan 1-70 sekali jalan:**

- **Stage 5 🔴🟠 (wajib sebelum launch / minggu pertama):** #1–3 rotasi & scanning secret (termasuk **scan riwayat git** `gitleaks`/`trufflehog` sebelum repo jadi publik — saat ini repo GitHub sudah ada, cek apakah pernah ada key ter-commit), #5–6 otorisasi per objek + IDOR (tes otomatis: akun A vs B vs admin vs anon), #7–8 RLS & Supabase storage audit, #13–14 secret tidak di bundle (`VITE_*` hanya anon key & URL), #15–18 validasi schema di semua Edge Function (zod di Deno) + parameterized (PostgREST otomatis parameterized), #19 CSP ketat + eskap default React + sanitasi markdown blog + escape JSON-LD, #20 CSRF N/A-nya: auth via header JWT (bukan cookie sesi custom) — dicatat, #24–26 Supabase Auth (kebijakan password, email konfirmasi, reset aman bawaan; rate limit reset), #28 rate limit di `create-order`, `lookup-order`, upload bukti, newsletter (limiter berbasis Postgres, per IP+per email), #31–32 webhook signature + status hanya dari server, #37/38 dependabot + lockfile + verifikasi tiap paket baru (bahaya paket karangan AI), #41 hak minimal (service role hanya di Edge Function; anon key + RLS untuk client), #44 backup: **`pg_dump` terjadwal (GitHub Action) ke storage privat + uji restore terdokumentasi** (backup Supabase free diverifikasi retensinya saat setup), #46–47 header & cookie, #49 N/A (bukan multi-tenant), #50 review setiap diff (manusia/agent lain) + jalur uang & auth wajib ada test, #55 MFA admin, #9/45 admin tidak terpublikasi.
- **Stage 7 🟡 (bulan pertama):** #21–23 upload bukti (dibatasi tipe/ukuran/nama acak; path privat — path traversal & SSRF N/A karena tidak ada fetch URL dari user), #39–40, #66–67 N/A (tidak ada fitur AI), #42–43 audit log & monitoring (Sentry free + uptime monitor + alert email), #51–54 allowlist field di setiap endpoint (DTO), #57–59 (sudah di desain state machine), #63–65 fail-closed, timeout semua panggilan keluar, DTO output (pangkas lookup-order), #68 risiko diterima (B8) dengan mitigasi CSP + tidak ada PII tambahan di storage browser, #69 hanya redirect internal (validasi `next` relatif), #70 tidak ada GraphQL.
- **CI/CD (#60–62):** GitHub Actions — lint + build + `npm audit` + gitleaks; action di-pin ke SHA; branch protection di `main`; deploy produksi hanya dari `main`.

**Accepted risks yang didokumentasikan (bukan diabaikan):** (a) sesi di localStorage (B8) dengan mitigasi CSP ketat + eskap + tanpa skrip pihak ketiga; ditinjau ulang saat SSR. (b) Supabase free tier tanpa PITR → ditambal pg_dump mingguan + drill restore.

---

## 6. Peta Checklist `checklist-legal-backend-security-app.md` → Pekerjaan

- **Bagian 1 (Legal, 20 item):** diterapkan seluruhnya, ditabelkan di §5.9. Yang **N/A**: tidak ada — semua 20 relevan untuk toko ini (beberapa dirakit manual, mis. consent & hapus data).
- **Bagian 2 (Backend fundamentals, 13 topik):** Auth ✔ (Supabase Auth, ditingkatkan), Rate limits ✔ (Step 5), Caching → header/CDN + `Cache-Control: private` untuk respons personal (lookup order) ✔, CORS ✔ dikunci ke domain, Indexing ✔ (index pada kolom query utama, sudah sebagian), Migrations ✔ (lanjutkan pola `supabase/migrations`, semua perubahan lewat migration file — termasuk perbaikan RLS; **tidak pernah** edit dashboard manual), Load balancing & Docker & WebSockets = **N/A** (dikelola platform / tidak dipakai), SSL ✔ (Cloudflare/Pages otomatis + HSTS), RBAC ✔ (role admin + `is_admin()`), Reverse proxies ✔ (Cloudflare di depan; `trust proxy` tdk relevan di stack ini), System design ✔ (dokumen ini).
- **Bagian 3 (70 item):** dipetakan per stage di §5.10. **N/A eksplisit** (dengan alasan, tidak dikarang): #39, #40, #66, #67 (tidak ada fitur AI), #49 (bukan multi-tenant), #52 (tidak ada pemanggilan shell), #53 (tidak ada deserialisasi objek dari input), #70 (tidak ada GraphQL). #54 (OAuth) hanya jika fitur Google login ditambahkan — saat ini email/password saja, dicatat.
- **Bagian 4:** checklist pre-launch versi cepat dipakai **apa adanya sebagai kriteria acceptance Stage 7** (dicentang satu-satu dengan bukti, bukan diklaim).

---

## 7. Peta 20 Schema `20-schema-ecommerce.md` → Bisa Diterapkan?

Jawaban singkat: **hampir semua bisa, asal datanya nyata; empat di antaranya butuh kondisi tertentu; dan semuanya baru sah kalau markup muncul di HTML yang benar-benar dikirim server (Stage 6 prerender).**

| # | Schema | Status | Syarat / Catatan |
|---|---|---|---|
| 1 | Product | ✅ Stage 6 | Dari tabel `products`; SKU nyata; **tanpa GTIN palsu** (batik bermerek sendiri biasanya tak punya barcode — properti dihilangkan, bukan diisi karangan) |
| 2 | ProductGroup | ✅ Stage 6 | Dari `product_variants` (ukuran/warna, K9) — aktif untuk semua produk ber-varian |
| 3 | Offer | ✅ Stage 6 | Harga & `availability` dari stok real-time DB (`InStock/OutOfStock` mengikuti `stock_available`); `price` = harga yang benar-benar dibayar pembeli (sudah termasuk PPN, K7) |
| 4 | Brand | ✅ Stage 6 | Brand sendiri; `sameAs` hanya untuk akun sosial yang benar-benar dipakai |
| 5 | MerchantReturnPolicy | ✅ Stage 6 | Setelah pemilik memutuskan kebijakan retur (§9.1 no.2) dan halaman retur tayang — angka di markup = angka di halaman |
| 6 | OfferShippingDetails | ✅ Stage 6 | Dari `shipping_zones` (tarif & estimasi nyata dari §9.1 no.3) |
| 7 | Review | 🟡 Post-launch | Hanya review asli pembeli yang tampil; modul review + moderasi dibangun setelah ada pembeli (anti review karangan) |
| 8 | AggregateRating | 🟡 Post-launch | Otomatis dihitung dari review nyata nanati; sebelum itu properti tidak dipasang |
| 9 | Organization | ✅ Stage 6 | Butuh data bisnis nyata (§9.1 no.1) + `hasMerchantReturnPolicy` |
| 10 | ContactPoint | ✅ Stage 6 | Hanya kontak yang benar-benar tampil di situs & aktif dijawab |
| 11 | PostalAddress | ⚠️ Kondisional | Hanya jika pemilik mau mempublikasikan alamat usaha (mis. alamat workshop). Kalau tidak → dilewati |
| 12 | LocalBusiness | ⚠️ Kondisional | Hanya jika ada lokasi fisik yang menerima kunjungan. Murni online → **tidak dipasang** (sesuai "jebakan" di file schema) |
| 13 | OpeningHoursSpecification | ⚠️ Kondisional | Mengikuti #12; tidak ada jam toko fiktif |
| 14 | WebSite | ✅ Stage 6 | Homepage; `publisher` → Organization |
| 15 | WebPage | ✅ Stage 6 | Semua halaman; `isPartOf` → WebSite, `mainEntity` sesuai tipe |
| 16 | BreadcrumbList | ✅ Stage 6 | Butuh breadcrumb **yang terlihat** di UI (ditambahkan di stage yang sama) |
| 17 | ItemList | ✅ Stage 6 | Halaman Shop/kategori; mengikuti pagination (hanya yang tampil) |
| 18 | BlogPosting | 🟡 Stage 6 (menyusul konten) | Dipasang per artikel saat benar-benar terbit; penulis = orang nyata yang disetujui pemilik |
| 19 | Person | 🟡 Stage 6 (menyusul konten) | Untuk author artikel; tanpa data pribadi yang tidak dipublikasikan |
| 20 | FAQPage | ✅ Stage 6 | FAQ nyata & tampil; dicatat bahwa Google membatasi rich result-nya untuk e-commerce umum — tetap dipasang untuk mesin/AI lain |

Checklist validasi dari file schema (harga numerik, availability dinamis, `@id` konsisten, tanggal ISO, telepon internasional, JSON valid, lolos Rich Results + validator) masuk sebagai definisi selesai Stage 6.

---

## 8. Tahapan Pengerjaan (urutan & definisi selesai)

Satu stage = satu sesi kerja yang bisa direview pemilik sebelum lanjut. Urutannya sengaja "uang & kejujuran dulu, polish belakangan".

**Stage 0 — Fondasi & deploy pertama**
- Buat organization + project Supabase (dipandu); link CLI; **konsolidasikan & rapikan migrations** (termasuk perbaikan RLS §5.3) dan jalankan; `.env` lokal + env di hosting; beli domain + DNS Cloudflare; deploy Cloudflare Pages (SPA + header keamanan dari `vercel.json` yang diterjemahkan); repo hygiene (branch protection, gitleaks CI, hapus bongkahan Xendit dari working tree setelah diekstrak bagian bergunanya).
- **Selesai bila:** app lama tampil utuh di domain baru, HTTPS, header keamanan terpasang, `curl -I /.env` → 404/403, Supabase tersambung.

**Stage 1 — Katalog & pesanan nyata (tanpa gateway dulu)**
- Tabel `products/product_variants/site_settings/shipping_zones` + seed 14 produk (ditandai **wajib diverifikasi pemilik**); pindah gambar ke Storage; halaman Shop/Detail baca DB; `create-order` (validasi skema, hitung ulang total server-side **termasuk pajak sesuai mode pengaturan K7**, reservasi stok atomik, order number, idempotensi); `lookup-order` dipangkas; order history per akun; hapus ketergantungan localStorage sebagai "database".
- **Selesai bila:** pesanan uji buatan pembeli masuk ke DB, terlihat pemilik, stok turun otomatis, dan mencoba memalsukan harga/status dari DevTools gagal (bukti tangkapan layar).

**Stage 2 — Pembayaran (manual + Duitku)**
- Halaman instruksi manual + upload bukti (Storage privat) + verifikasi admin **sementara** (masih boleh lewat dashboard Supabase di stage ini); adapter Duitku + sandbox + callback terverifikasi + anti-replay; halaman success/failed versi baru (polling, tanpa percaya redirect); expiry job; email transaksional dasar.
- **Selesai bila:** dua skenario penuh lolos di sandbox: (a) bayar manual → upload bukti → (admin tandai valid) → status `paid`; (b) bayar Duitku sandbox → callback → status `paid` otomatis; keduanya meninggalkan jejak di `order_events` dan melepas/mengonversi stok dengan benar.

**Stage 3 — Panel admin & notifikasi lengkap**
- `/admin` lengkap (§5.5): auth + MFA, pesanan (verifikasi bukti, resi, status), produk & stok, konten, pengaturan, subscriber, ringkasan; email Resend (pembeli + pemilik); lonceng notifikasi.
- **Selesai bila:** pemilik menyelesaikan satu pesanan penuh dari panel admin tanpa membuka dashboard Supabase, tanpa membaca SQL.

**Stage 4 — Legal, trust & aksesibilitas**
- Semua halaman legal + FAQ + Kontak (data nyata); consent clickwrap + `consent_records`; unsubscribe nyata; ekspor & hapus akun; hapus testimoni karangan, newsletter palsu, tautan sosial/nomor placeholder; audit klaim copy; font self-host; pass aksesibilitas (alt, kontras, keyboard, fokus, label); copy id/en rapi.
- **Selesai bila:** tidak ada satu pun data/klaim palsu di situs (audit ulang berdasar daftar §3); alur consent & unsubscribe terbukti jalan dan tercatat; audit aksesibilitas dasar lolos.

**Stage 5 — Hardening keamanan (checklist 🔴🟠)**
- Rate limiting, scan riwayat git + secret, tes otorisasi (IDOR/authz) otomatis, CORS dikunci, CSP diverifikasi di produksi, error generik, timeout panggilan keluar, Sentry + uptime monitor, backup pg_dump + drill restore, dependabot + pin actions, audit log dicek.
- **Selesai bila:** seluruh item 🔴 & 🟠 checklist bagian 4 tertutup dengan bukti (atau didefer eksplisit beserta alasan tertulis); tes otorisasi hijau.

**Stage 6 — SEO, schema & konten**
- JSON-LD builder + semua schema yang datanya tersedia (§7) + breadcrumb UI + sitemap/robots/canonical + prerender + blog (6–8 artikel) + FAQ; validasi Rich Results & validator.schema.org; Search Console didaftarkan (pemilik).
- **Selesai bila:** markup tiap halaman yang berlaku lolos validator, muncul di HTML mentah, dan nol perbedaan antara markup vs isi halaman.

**Stage 7 — Go-live QA & runbook operasional**
- Jalankan **checklist pre-launch versi cepat (bagian 4 file checklist) sebagai acceptance** dicentang dengan bukti; uji E2E pembeli nyata (sandbox → **live kecil**: 1 transaksi riil nominal kecil via Duitku live lalu refund manual/diabaikan sebagai biaya uji — keputusan pemilik); runbook: cara verifikasi transfer, kirim paket, isi resi, retur, hapus data, restore backup, apa yang dilakukan kalau Duitku down (fallback manual), kontak bantuan.
- **Selesai bila:** transaksi live pertama berhasil end-to-end dan pemilik menyatakan bisa menjalankannya sendiri.

**Backlog pasca-launch (tidak masuk v1):** modul review → schema Review/AggregateRating; kupon; integrasi kurir live; pengiriman internasional + polish EN; modul grosir/B2B (kalau dikonfirmasi §9.1 no.7); WA API berbayar; SSR penuh kalau trafik/konten menuntut.

---

## 9. Yang Dibutuhkan dari Pemilik

### 9.1 Data & keputusan (jawaban mengubah hasil akhir)

1. **Identitas usaha** untuk halaman legal/footer/schema: nama yang mau tampil, kota & alamat (mau dipublikasikan atau tidak), email bisnis, nomor WhatsApp bisnis, akun Instagram/TikTok resmi (kalau ada).
2. **Kebijakan retur**: berapa hari (lazim 7), kondisi (label masih terpasang?), siapa menanggung ongkir retur, boleh tukar ukuran?, produk custom bisa retur?
3. **Ongkir & kurir**: tarif per zona, estimasi hari, kurir. **Status: DITUNDA oleh pemilik (K8)** — sampai diisi, situs tidak menjanjikan gratis ongkir dalam bentuk apa pun dan checkout menolak transaksi (mode pra-launch). Yang dibutuhkan nanti: angka tarif + kurir + estimasi.
4. **Rekening/e-wallet + QRIS** untuk jalur transfer manual (gambar QRIS disiapkan).
5. **Verifikasi katalog**: dari 14 produk — harga final, stok nyata (mode **SKU berulang per ukuran/warna**, K9), foto asli (dan hak pakainya), berat/dimensi paket untuk ongkir.
6. **Konfirmasi akun**: bikin project Supabase (dipandu), daftar Duitku (dipandu; siapkan KTP — perorangan), beli domain, akun Cloudflare, akun Resend. Semua ini pekerjaan pemilik dengan panduan; builder tidak menerima kata sandi.
7. **B2B/grosir**: ada rencana jual ke reseller/toko? (kalau ya → modul inquiry grosir masuk backlog terprioritas).
8. **Penulis konten**: nama penulis untuk artikel (Person schema) dan siapa yang me-review draf (asumsi: pemilik, dengan masukan; brand story "Janoer Koening" perlu cerita nyata dari pemilik).
9. **Setuju anggaran**: domain ±Rp150–300rb/tahun; fee Duitku per transaksi (tergantung metode); Rp0 untuk layanan gratis; opsi berbayar masa depan (Supabase Pro $25/bln saat data besar, Resend/WA upgrade) — semua opsional & ditunda sampai perlu.
10. **Konfirmasi bahasa**: Indonesia utama + toggle English dipertahankan? (keputusan awal B9 — konten Indonesia dulu)
11. **Pajak — dijawab: PKP (K7).** Yang masih dibutuhkan saat setup: NPWP yang mau dicantumkan + konfirmasi tarif PPN yang berlaku untuk produk ini + cara penerbitan faktur pajak penjualan online (konsultasi/konsultan pajak; aplikasi menerbitkan **nota pembelian ber-NPWP dengan rincian PPN**, e-faktur resmi tetap di luar aplikasi — catat di runbook). Kalau status ternyata bukan PKP, cukup ubah mode di pengaturan.

### 9.2 Keputusan perancang yang perlu dicek pemilik (silakan bantah)

- B1 Cloudflare Pages (bukan Vercel Hobby — pembatasan komersial; Vercel Pro berbayar).
- B2 Tetap SPA + prerender, bukan migrasi Next.js sekarang.
- B3 Produk pindah ke Supabase + varian **SKU berulang per ukuran/warna (K9)**.
- B4 JSON-LD dibangun satu modul dari data yang sama dengan UI.
- B5 Tanpa pixel analytics; Plausible cookieless opsional → tidak ada consent banner non-esensial di v1.
- B6 Font self-host (OFL); tidak ada CDN font pihak ketiga.
- B7 Blok fitur AI di checklist dinyatakan N/A (tidak ada fitur AI).
- B8 Sesi localStorage dengan mitigasi CSP; ditinjau saat SSR.
- B9 Konten DB (produk/blog/legal/email) Indonesia dulu; UI tetap bilingual; kolom terjemahan disiapkan.
- B10 Pembeli hanya bisa membatalkan sendiri saat `pending_payment`; setelah itu lewat admin/kebijakan retur.
- B11 Panel admin mobile-first (operator bekerja dari HP).
- B12 Newsletter v1 = kumpulkan + unsubscribe nyata; kampanye dikirim pemilik via Resend (runbook); kuota transaksional dipisah.
- B13 Prerender di-refresh otomatis via deploy hook (trigger DB & tombol publish) supaya markup tidak basi.
- B14 Harga katalog = harga yang dibayar (termasuk PPN, K7); tanpa biaya tersembunyi; fee gateway diserap penjual.
- B15 Pembeli guest tetap bisa ekspor/hapus data via form publik + verifikasi email + antrean di admin; pesanan lama tertaut otomatis saat daftar akun.
- Retur default *draf* 7 hari (selama pemilik belum menjawab §9.1 no.2, angka ini hanya placeholder untuk desain — tidak boleh tayang sebelum dijawab).

---

## 10. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Verifikasi akun Duitku (live) lambat / mutasi dokumen | Jalur manual transfer sudah menghasilkan uang sejak Stage 2; Duitku menyusul tanpa mengubah UI |
| Data katalog/foto belum siap → launch tergantung pemilik | Stage 1–3 bisa jalan penuh dengan data seed yang ditandai `perlu_verifikasi`; gate go-live di Stage 7 memblokir data palsu tayang |
| Bandwidth pemilik terbatas (operator tunggal) | Stage kecil-kecil, tiap stage ada definisi selesai & bisa direview; semua operasi dirancang ≤2 menit per pesanan |
| Kehilangan data (bug/ransomware) | Backup harian Supabase + pg_dump mingguan + drill restore (Stage 5) |
| Repo GitHub publik memuat riwayat dengan secret lama | Scan gitleaks riwayat penuh di Stage 5; rotasi; repo dipertimbangkan di-private saat pindah produksi |
| Vercel/Cloudflare ToS berubah | Header & redirect disimpan sebagai file platform-agnostic; pindah host = pekerjaan < 1 jam |
| Scope creep (B2B, review, kurir live) | Semua masuk backlog eksplisit §8; v1 didefinisikan sempit |

---

## 11. Kriteria Penerimaan Akhir (v1)

1. **Uang:** minimal satu transaksi live (nominal kecil) sukses via Duitku **dan** satu via transfer manual terverifikasi; bukti di `order_events` + `stock_movements`; pembeli menerima email.
2. **Operasional:** pemilik menyelesaikan siklus pesanan penuh dari panel admin tanpa bantuan teknis; ada runbook.
3. **Legal:** semua item Bagian 1 checklist tertutup dengan bukti file/halaman; consent & unsubscribe & hapus/ekspor data terbukti bekerja; nol konten palsu.
4. **Keamanan:** item 🔴 & 🟠 checklist tertutup dengan bukti; tes otorisasi (A/B/admin/anon) hijau; tidak ada secret di repo/riwayat; monitoring & backup aktif (restore pernah diuji).
5. **SEO:** semua schema §7 yang berstatus ✅ lolos validator dan ada di HTML mentah; sitemap & robots benar; Search Console terpasang.
6. **UX:** alur beli (katalog → bayar → lacak) mulus di ponsel; audit aksesibilitas dasar lolos; tidak ada teks/terjemahan setengah jadi.
7. **Checklist bagian 4** dicentang satu per satu dengan bukti (bukan klaim).

---

## 12. Yang Diserahkan ke Builder

Detail teknis yang sengaja tidak diikat di sini: struktur komponen/folder admin, skema kolom final, gaya penulisan SQL/fungsi, implementasi prerender (puppeteer/react-dom-server), mekanisme rate limiter di Postgres, format email, isi draf artikel (dengan review pemilik), dan urutan commit. Semua tetap tunduk pada: keputusan §0, larangan §2 (anti-goals), dan kriteria §11.

---

*Dokumen ini menggantikan asumsi-asumsi pada `COPILOT_*.md` yang lama; file-file itu tetap sebagai arsip riwayat kerja.*
