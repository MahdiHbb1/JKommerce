# Runbook 01 — Domain & Hosting (Cloudflare Pages)

Panduan ini untuk pemilik toko. Tujuan: situs hidup di domain sendiri, HTTPS,
tanpa menyewa server/VPS. Arsitektur final v1 = **statis (SPA) di Cloudflare
Pages + Supabase**; tidak ada nginx/PM2 yang perlu diurus.

## Ringkasan alur

1. Beli domain.
2. Pindahkan DNS ke Cloudflare (gratis).
3. Hubungkan repo GitHub ke Cloudflare Pages.
4. Pasang domain di Pages.
5. Verifikasi HTTPS, header keamanan, dan SPA fallback.

Langkah 1–2 dan 4–5 butuh aksi pemilik. Langkah 3 sebagian besar di dashboard.

## 1. Beli domain (owner)

Kandidat (urut prioritas):

1. `janoerkoeningbatik.com` — paling mudah diingat, cocok untuk merek.
2. `janoerkoeningbatik.id` — kesan lokal Indonesia.
3. `batikjanoerkoening.com` — cadangan bila dua di atas terpakai.

Registrar yang aman dipakai: **Rumahweb** (lokal, pembayaran Indonesia) atau
**Namecheap** (internasional). Yang penting:

- Aktifkan **auto-renew** supaya domain tidak lepas.
- Simpan email registrar yang benar; email ini juga dipakai verifikasi.
- Tidak perlu beli hosting/e-mail di registrar; Cloudflare gratis cukup.

Catat: tanggal beli, tanggal kedaluwarsa, dan login registrar di password
manager. Jangan kirim data login ke chat.

## 2. Pindahkan DNS ke Cloudflare (owner + agent)

1. Daftar gratis di <https://dash.cloudflare.com>.
2. **+ Add a site** → masukkan domain → pilih plan **Free**.
3. Cloudflare menampilkan dua nameserver, contoh:
   `alice.ns.cloudflare.com` dan `bob.ns.cloudflare.com`.
4. Buka registrar → kelola domain → **Nameservers** → ganti dengan dua
   nameserver Cloudflare di atas → simpan.
5. Tunggu 1–24 jam (biasanya &lt;1 jam). Cloudflare mengirim e-mail saat aktif.
6. Setelah aktif: Cloudflare → **SSL/TLS → Overview** → pilih **Full (strict)**.

Kalau lupa langkah 6, HTTPS bisa error saat domain dipasang di Pages.

## 3. Hubungkan repo ke Cloudflare Pages

Repo GitHub: `MahdiHbb1/JKommerce` (paket aplikasi ada di folder
`batik-ecommerce/`).

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Izinkan akses ke repo `JKommerce` (boleh hanya repo ini).
3. Isi pengaturan build:

   | Pengaturan | Nilai |
   |---|---|
   | Production branch | `main` |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | `batik-ecommerce` |
   | Node version (env) | `NODE_VERSION` = `20` |

4. **Environment variables (Production)** — ambil nilainya dari `.env` lokal
   (lihat Runbook 00), jangan pernah commit ke repo:

   ```text
   VITE_SUPABASE_URL=https://qktvhhzniaearlpzbffv.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-public-key>
   VITE_WHATSAPP_NUMBER=<nomor asli atau kosongkan>
   ```

   - `VITE_WHATSAPP_NUMBER`: isi nomor asli (format `62...`) setelah pemilik
     menentukannya; kalau belum ada, kosongkan. **Jangan** isi nomor contoh.
   - `VITE_*` memang ikut ter-bundle ke browser; itu sebabnya hanya URL + anon
     key yang boleh ada di sini. `service_role` **tidak boleh** masuk Pages.

5. Klik **Save and Deploy**. Deploy pertama berjalan otomatis.

Catatan penting: repo `main` di GitHub baru berisi versi lama sampai PR
Stage 0–1 di-merge dan di-push (Task 15, menunggu izin pemilik). Jadi deploy
pertama hanya menguji pipa hosting; konten final menyusul setelah push.

## 4. Pasang domain di Pages (owner + agent)

1. Buka project Pages → **Custom domains → Set up a domain**.
2. Masukkan domain utama (mis. `janoerkoeningbatik.com`), lalu ulangi untuk
   `www.janoerkoeningbatik.com`.
3. Karena DNS sudah di Cloudflare, Cloudflare membuat record-nya otomatis.
4. Pilih satu sebagai kanonik (disarankan `https://janoerkoeningbatik.com`)
   dan arahkan `www` ke domain utama.
5. Tunggu status **Active** (biasanya beberapa menit).

## 5. Verifikasi (agent setelah deploy)

Dari PowerShell (Windows):

```powershell
curl.exe -I https://janoerkoeningbatik.com/
curl.exe -I https://janoerkoeningbatik.com/.env
curl.exe -s https://janoerkoeningbatik.com/shop | Select-Object -First 5
```

Yang harus terlihat:

- Respons pertama memuat `strict-transport-security` dan
  `content-security-policy`.
- `/.env` → **404** (file rahasia tidak pernah ikut ter-deploy).
- `/shop` mengembalikan HTML aplikasi (SPA fallback jalan), bukan 404.
- Buka domain di browser: halaman tampil, tab Console tanpa error merah;
  cek juga tampilan mobile (DevTools → device toolbar).

## 6. Kalau ada masalah

- **Build gagal**: buka log deploy di Pages; cek `NODE_VERSION=20` dan
  env vars terisi.
- **Gambar Supabase tidak muncul**: header CSP harus memuat
  `https://*.supabase.co` di `img-src` (sudah diatur di `public/_headers`).
- **Refresh halaman 404**: pastikan `public/_redirects` berisi
  `/* /index.html 200` dan ikut ter-build ke `dist`.
- **Rollback cepat**: Pages → Deployments → pilih deploy lama →
  **Rollback to this deployment**.

## Yang tidak dipakai di v1

- Tidak ada VPS/nginx/PM2/OS server.
- Tidak ada `vercel.json`; header keamanan hidup di `public/_headers`,
  redirect SPA di `public/_redirects`.
- Konfigurasi alternatif (Vercel/Netlify) disimpan hanya sebagai riwayat;
  jalur resmi adalah Cloudflare Pages.
