-- Storage buckets. Gambar produk/konten publik-baca; bukti pembayaran privat
-- (akses lewat signed URL / Edge Function service role di Plan 2).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('content-images', 'content-images', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']::text[]),
  ('payment-proofs', 'payment-proofs', false, 5242880,
   array['image/jpeg', 'image/png', 'application/pdf']::text[])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy product_images_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-images');

create policy content_images_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'content-images');

create policy product_images_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

create policy product_images_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

create policy product_images_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

create policy content_images_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'content-images' and public.is_admin());

create policy content_images_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'content-images' and public.is_admin())
  with check (bucket_id = 'content-images' and public.is_admin());

create policy content_images_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'content-images' and public.is_admin());

-- payment-proofs: sengaja tanpa policy browser. Pemilik/admin membaca lewat
-- signed URL, pembeli mengunggah lewat Edge Function service role (Plan 2).
