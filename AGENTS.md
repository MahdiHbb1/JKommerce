# Panduan Agen — batik-ecommerce (JKommerce)

Toko batik premium "Janoer Koening": React 18 + Vite + Tailwind 3 + Supabase. Operator tunggal (non-teknis); konten berbahasa Indonesia; UI bilingual id/en.

## Dokumen kunci (baca sebelum mulai task)

- **Rencana aktif** — `docs/superpowers/plans/2026-10-19-stage-0-1-foundation-catalog-orders.md`: kerjakan per task; patuhi Global Constraints, Interfaces, dan Review Focus di dalamnya.
- **Dokumen desain** — `docs/superpowers/specs/2026-10-19-jkommerce-upgrade-design.md`: kontrak keputusan (Stage 0-7, model data, schema, checklist legal/keamanan).
- **Arah desain** — `DESIGN.md`: wajib dibaca untuk semua kerja UI.

## Aturan kerja

- Semua uang = integer rupiah; format nomor pesanan & status mengikuti Global Constraints rencana.
- Tidak pernah commit secret; `.env` gitignored; semua perubahan skema lewat `supabase/migrations/` (tidak pernah edit dashboard).
- Commit kecil per task (Conventional Commits). Jangan push tanpa instruksi.
- Eksekusi mengikuti alur **subagent-driven**: satu task = implementasi + review independen sebelum lanjut.
- Arsitektur v1 = **serverless**: Cloudflare Pages (SPA) + Supabase (Postgres/Auth/Storage/Edge Functions). Tidak ada VPS, nginx, PM2, atau OS server yang dikelola; jangan menambah komponen arsitektur baru tanpa persetujuan pemilik.

<!-- antislop:start -->
## antislop (mode DURING)

Proyek ini memakai filter antislop. Mode **DURING**: aturan diterapkan sambil kerja, dan setiap penyerahan kerja UI/copy ditutup **Delivery Gate** (PASS/FAIL dengan bukti; termasuk klik-ulik nyata di browser).

Skill tersedia di lingkungan agen (muat lewat skill tool sesuai kebutuhan):
- `antislop` (core; wajib untuk kerja UI, copy, atau layout)
- `antislop-ui`, `antislop-layoutmobile`, `antislop-human`, `antislop-copywriting`, `antislop-code`
- Arah visual diambil dari `DESIGN.md`, lalu difilter oleh skill di atas.
<!-- antislop:end -->
