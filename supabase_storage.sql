-- ══════════════════════════════════════════════════════════
--  Ejecuta esto en Supabase → SQL Editor para crear el
--  bucket de imágenes y sus políticas de acceso
-- ══════════════════════════════════════════════════════════

-- Crear bucket público para imágenes de productos
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Permitir a usuarios autenticados subir imágenes
create policy "Authenticated upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images');

-- Permitir a usuarios autenticados actualizar/eliminar sus imágenes
create policy "Authenticated update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images');

create policy "Authenticated delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images');

-- Permitir lectura pública de imágenes
create policy "Public read" on storage.objects
  for select to public
  using (bucket_id = 'product-images');
