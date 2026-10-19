# Runbook 00 — Setup Supabase & Koneksi Repo

Panduan ini untuk pemilik toko. Tujuan: menyambungkan aplikasi ke project
Supabase, tanpa pernah membocorkan kunci rahasia.

## Yang perlu disiapkan

- Akun Supabase (gratis): <https://supabase.com/dashboard>
- Project: `janoer-koening`, region **Southeast Asia (Singapore)**
- Password database yang kamu simpan saat membuat project (di password manager)

## 1. Ambil identitas project

Buka project di dashboard, lalu:

- **Project URL** — bentuknya `https://<project-ref>.supabase.co`.
  Contoh: `https://abcdefghijklmnop.supabase.co`.
- **Project ref** — bagian `<project-ref>` di URL itu (16 huruf).
  Bisa juga dilihat di **Project Settings → General → Project ID / Reference**.
- **Anon public key** — **Project Settings → API → Project API keys → anon public**.
  Key ini memang publik (aman dipakai di browser), tetapi tetap jangan diganti
  dengan `service_role`.

> `service_role` / secret key **tidak boleh** masuk browser, chat, atau commit.
> Untuk seed lokal sekali jalan, kunci boleh dimuat ke environment proses
> (tidak ditulis ke repo); untuk produksi, simpan hanya di Supabase Edge
> Function secrets.

## 2. Isi `.env` lokal

Buka file `D:\HBB\WEBSJKDD\batik-ecommerce\.env` dengan Notepad, lalu isi:

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
VITE_WHATSAPP_NUMBER=62xxxxxxxxxx
```

File `.env` sudah ada di `.gitignore`; **jangan pernah** commit atau mengirim isinya.

## 3. Buat Personal Access Token (scoped) untuk CLI

Supabase kini mendukung **scoped token** (GA 6 Okt 2026). Pakai ini, bukan
legacy/account-level token yang punya akses penuh ke semua project.

1. Buka <https://supabase.com/dashboard/account/tokens> → **Generate new token**.
2. Nama: `opencode-cli`.
3. **Resources:** pilih hanya project `janoer-koening`
   (ref `qktvhhzniaearlpzbffv`).
4. **Permissions** minimum untuk `supabase link` + migrasi:
   - **Project Settings** — Read
   - **API Keys** — Read
   - **API Key Secrets** — Read
   - **Database** — Read (opsional; `db push` memakai password database,
     bukan izin token)
5. **Expiry:** 90 hari atau 1 tahun.
6. Copy token (scoped diawali `sbp_fc`), lalu tambahkan ke `.env`:

```dotenv
SUPABASE_ACCESS_TOKEN=sbp_fc...
```

Catatan:

- Scope token **tidak bisa diubah** setelah dibuat; untuk mengubah, hapus lalu
  buat token baru.
- Nanti saat deploy Edge Functions, buat token kedua dengan
  **Edge Functions: Write** (dan **Secrets: Write** bila perlu
  `supabase secrets set`). Jangan memperluas token ini.
- Jangan beri akses billing, organization settings, atau penghapusan project.
- Kalau token bocor: hapus di halaman yang sama, lalu buat baru.

## 4. Ambil connection string database

1. Di dashboard project, klik **Connect** (tombol di bagian atas).
2. Pilih tab **Direct** ("Connection string"). Di panel itu cari dropdown
   **Connection pooling** → pilih **Session pooler** / **Session**.
   Kalau panel hanya menampilkan **Direct connection**, copy URI direct-nya
   (host `db.<project-ref>.supabase.co`) — tetap bisa dipakai `verify-db`.
   Direct kadang IPv6-only; kalau gagal konek, ganti host menjadi
   `aws-0-ap-southeast-1.pooler.supabase.com` port `5432` dengan user
   `postgres.<project-ref>`.
   Tab **Server** bukan tempat connection string — itu untuk Supabase SDK
   (`SUPABASE_SECRET_KEY`), jangan dipakai/di-copy ke `.env`.
3. Copy **URI**-nya (bukan format `psql`/JDBC).

```text
postgresql://postgres.<project-ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

4. Tambahkan ke `.env`:

```dotenv
SUPABASE_DB_URL=postgresql://...
```

Kalau lupa password database: **Project Settings → Database → Reset database
password**, simpan password baru, lalu ambil ulang URI-nya.

## 5. Verifikasi

Dari folder `batik-ecommerce`:

```bash
node scripts/verify-db.mjs
```

Hasil yang diharapkan: deretan baris `PASS ...` lalu ditutup:

```text
DB OK
```

Skrip memeriksa tabel/RLS/privilege, uji balapan stok, idempotency, dan
pembatalan — semuanya harus `PASS`; satu `FAIL` berarti `DB FAIL` (exit code 1).

Kalau muncul `DB FAIL`:

- `password authentication failed` → password di URI salah; reset dan ulangi.
- `getaddrinfo` / timeout → coba connection string **Session pooler**, bukan
  **Direct connection** (direct bisa IPv6-only di sebagian jaringan).
- `SUPABASE_DB_URL belum diset` → baris di `.env` belum terisi/salah nama.

## 6. Yang dilakukan agent setelah ini

- `supabase link --project-ref <project-ref>` (memakai `SUPABASE_ACCESS_TOKEN`).
- Menjalankan migrasi dari `supabase/migrations/`:

  ```powershell
  npx supabase db push --db-url $env:SUPABASE_DB_URL
  ```

  **Catatan:** `supabase db push --linked` bisa gagal dengan
  `DbConfigIpv6Error` di jaringan tanpa IPv6 karena CLI mencoba koneksi direct.
  Selalu pakai `--db-url` dengan URI **Session pooler** dari `.env`.
- Menambah assertion ke `scripts/verify-db.mjs` di task berikutnya.

## 7. Seed katalog (lokal, sekali)

Setelah migrasi diterapkan:

1. Agent memuat kunci `service_role`/secret dari Management API memakai token
   scoped (izin **API Key Secrets Read**) ke environment proses. Nilainya tidak
   ditampilkan dan tidak ditulis ke repo.
2. Jalankan:

   ```bash
   node scripts/seed-products.mjs
   ```

   Hasil yang diharapkan: `14 produk`, `144 varian`, `10 gambar`, lalu
   `Seed OK`.
3. Script **idempoten**: dijalankan ulang akan melewati produk/varian/gambar
   yang sudah ada. Stok varian yang sudah ada **tidak diubah**, jadi aman
   dijalankan lagi setelah pemilik mengubah stok.
4. Alternatif manual: tambahkan sementara
   `SUPABASE_SERVICE_ROLE_KEY=...` ke `.env`, jalankan script, lalu hapus
   barisnya. Jangan pernah commit atau mengirim kunci ini ke chat.
5. Kalau muncul `Butuh SUPABASE_URL ...`, pastikan `.env` disimpan sebagai
   **UTF-8 tanpa BOM**. Karakter BOM tak terlihat di awal nama variabel membuat
   Node/Vite tidak membaca variabel itu; minta agent membersihkannya.

## Aturan keamanan

- Jangan pernah commit `.env` atau menyalin isinya ke dokumen/chat.
- `service_role` key hanya untuk Edge Function (nanti lewat `supabase secrets`).
- Token CLI bisa dicabut kapan saja di halaman Access Tokens.
- Nanti untuk produksi: buat project terpisah (staging vs produksi) bila
  kuota free tier mencukupi; jangan pakai project yang sama untuk eksperimen
  berbahaya.
