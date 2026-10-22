# DESIGN.md — Arah Desain Janoer Koening (JKommerce)

Status: arah disetujui pemilik 19 Okt 2026 (pilihan "A: Heritage Editorial Hangat"), ditulis berdasar jawaban pemilik + riset basis data UI/UX.
File ini adalah **arah**, bukan token final. Stage 4.5 (lihat dokumen desain §8) menerjemahkannya menjadi token & komponen, lalu ditutup Delivery Gate antislop dengan bukti.
Filter antislop berlaku **MODE DURING**: diterapkan sambil bekerja, bukan audit belakangan.

## Identitas

- Produk: batik premium "Janoer Koening" — batik tulis/cap untuk dipakai sehari-hari dan acara.
- Kepribadian: seperti galeri/perajin yang percaya diri — hangat, tenang, teliti. Bicara spesifik (asal motif, proses, cara perawatan), bukan tagline.
- Audiens: pembeli Indonesia (utama) + penggemar batik luar negeri. UI bilingual id/en; konten (produk/blog/legal/email) Indonesia dulu.
- Bahasa visual: editorial heritage — disiplin grid yang bersih dipadu kehangatan warna dan tekstur; fotografi produk sebagai bintang.

## Dial (antislop Part 3, wajib)

**ENERGY 2 / RHYTHM 2 / MOTION 2**

- ENERGY 2 — percaya diri tapi tidak berteriak; fokus ke produk, bukan efek.
- RHYTHM 2 — komposisi konsisten dengan beberapa variasi (hero, jeda editorial, sorotan koleksi); tidak seragam membosankan, tidak asimetris liar.
- MOTION 2 — transisi & reveal halus yang punya alasan; tanpa parallax/pin/choreography.

## Palet (dasar; dikunci di Stage 4.5)

Basis: skala cokelat & emas yang sudah ada di `tailwind.config.js`, dirapikan dengan riset palet "luxury e-commerce".

- Latar: krem hangat `#FAF7F2` (nuansa kertas, bukan putih steril).
- Teks utama: `#1C1917`; teks sekunder `#57534E`.
- Cokelat brand: keluarga yang sudah ada (`primary` 500 `#8B6F47` dst.).
- Aksen tunggal: emas matang `#A16207` (lebih gelap dari `#D4AF37` yang terlalu kuning; lebih aman untuk kontras).
- Border/muted: batu hangat (`#E7E5E4`, `#78716C`).
- Destructive: `#DC2626`.
- Aturan: maksimal 2-3 warna inti + 1 aksen per layar; bayangan diwarnai hangat (bukan hitam pekat); gradien hanya bila memisahkan hierarki dan alasannya tertulis — bukan identitas.

Alasan (antislop R-31): keluarga warna dipertahankan karena sudah jadi DNA brand dan sejalan dengan rekomendasi palet luxury; emas digeser lebih gelap supaya lebih elegan dan lolos kontras.

## Tipografi

- Display/judul: **Playfair Display** (serif; 400-700; tracking lebih rapat untuk display besar).
- Body/UI: **Inter** (300-700; tinggi baris ~1.6; lebar paragraf ~65 karakter).
- Harga/angka: `font-variant-numeric: tabular-nums`.
- Label kecil: sentence case (bukan ALL-CAPS bertaburan).
- Wajib **self-host** (keduanya lisensi OFL). Temuan audit: kedua font dideklarasikan di puluhan file CSS tapi belum pernah dimuat — tampilan saat ini memakai font fallback sistem.
- File CSS yang menyebut `Poppins` dinormalkan ke stack ini di Stage 4.5.

Alasan: formasi Playfair + Inter = "Classic Elegant" dari basis riset (mood luxury/editorial/fashion) dan sudah menjadi niat desain yang ada.

## Fotografi & tekstur

- Foto produk asli milik pemilik di latar kayu/kain hangat; tanpa stok foto generik, tanpa ilustrasi 3D/blob.
- Tekstur kertas/grain halus boleh sebagai aksen latar (alasan: menghangatkan kanvas editorial) — dosis kecil, bukan pola dominan.
- Semua gambar memiliki `alt` yang benar-benar mendeskripsikan isi.

## Motion

- Hover/press feedback jelas (150-300ms); state pressed = `scale(0.98)` / translasi kecil.
- Reveal halus saat scroll (stagger ringan) seperlunya — bukan "fade up everywhere".
- Scroll: pindah halaman mulai dari atas (instan, bukan smooth); anchor `#` boleh halus; `prefers-reduced-motion` selalu dihormati.

## Larangan arah ini (di atas filter antislop)

- Tanpa glassmorphism bertumpuk, glow di mana-mana, atau gradien biru-ungu.
- Tanpa em dash di teks apa pun (R-02); tanpa klaim, statistik, atau testimoni karangan (R-17/18/36/38).
- Ikon hanya bila fungsional dan relevan, dengan alasan; tanpa ikon dekoratif ala default library.
- Tema terang (paper/gallery) sebagai identitas; tanpa mode gelap di v1. Bila nanti diminta, wajib merawat kedua mode penuh (R-34).

## Ruang lingkup penerapan

- Diterapkan penuh di **Stage 4.5** (desain, motion & kenyamanan).
- Perbaikan global yang murah (scroll restoration, focus-visible, reduced-motion guard) dikerjakan lebih awal di **Plan 1 Task 14**.
- Semua penyerahan kerja UI menyertakan **Delivery Gate antislop** (PASS/FAIL dengan bukti, termasuk klik-ulik nyata).
