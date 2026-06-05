-- ============================================================
-- POLÍTICAS DO STORAGE (buckets motos-fotos e motos-docs)
-- Execute no SQL Editor do Supabase. Seguro para rodar sempre.
-- Sem isso, o upload de fotos/logo/capa/documentos é bloqueado.
-- ============================================================

-- ---------- Bucket motos-fotos (público) ----------

-- Qualquer um pode ver as fotos (necessário para listagem/transform)
drop policy if exists "storage_fotos_public_read" on storage.objects;
create policy "storage_fotos_public_read" on storage.objects
  for select to public
  using (bucket_id = 'motos-fotos');

-- Admin logado pode enviar
drop policy if exists "storage_fotos_admin_insert" on storage.objects;
create policy "storage_fotos_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'motos-fotos');

-- Admin logado pode substituir
drop policy if exists "storage_fotos_admin_update" on storage.objects;
create policy "storage_fotos_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'motos-fotos')
  with check (bucket_id = 'motos-fotos');

-- Admin logado pode excluir
drop policy if exists "storage_fotos_admin_delete" on storage.objects;
create policy "storage_fotos_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'motos-fotos');

-- ---------- Bucket motos-docs (privado) ----------

-- Somente admin logado lê (necessário para gerar signed URL)
drop policy if exists "storage_docs_admin_select" on storage.objects;
create policy "storage_docs_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'motos-docs');

-- Admin logado pode enviar
drop policy if exists "storage_docs_admin_insert" on storage.objects;
create policy "storage_docs_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'motos-docs');

-- Admin logado pode excluir
drop policy if exists "storage_docs_admin_delete" on storage.objects;
create policy "storage_docs_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'motos-docs');

-- ============================================================
-- Conferência: políticas ativas do Storage
-- ============================================================
select policyname, roles, cmd
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
