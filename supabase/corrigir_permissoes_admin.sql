-- ============================================================
-- CORREÇÃO DE PERMISSÕES DO ADMIN (RLS)
-- Execute no SQL Editor do Supabase. Seguro para rodar sempre.
-- Recria TODAS as políticas do role authenticated (admin logado).
-- ============================================================

-- Motos: admin pode tudo
drop policy if exists "motos_admin_all" on motos;
create policy "motos_admin_all" on motos for all to authenticated
  using (true) with check (true);

-- Fotos: admin pode tudo
drop policy if exists "fotos_admin_all" on moto_fotos;
create policy "fotos_admin_all" on moto_fotos for all to authenticated
  using (true) with check (true);

-- Documentos: admin pode tudo
drop policy if exists "docs_admin_all" on moto_documentos;
create policy "docs_admin_all" on moto_documentos for all to authenticated
  using (true) with check (true);

-- Leads: admin lê
drop policy if exists "leads_admin_read" on leads;
create policy "leads_admin_read" on leads for select to authenticated
  using (true);

-- Loja: admin lê e atualiza
drop policy if exists "lojas_admin_read" on lojas;
create policy "lojas_admin_read" on lojas for select to authenticated
  using (true);

drop policy if exists "lojas_admin_update" on lojas;
create policy "lojas_admin_update" on lojas for update to authenticated
  using (true) with check (true);

-- Links: admin pode tudo
drop policy if exists "links_admin_all" on loja_links;
create policy "links_admin_all" on loja_links for all to authenticated
  using (true) with check (true);

-- Cliques: admin lê
drop policy if exists "clicks_admin_read" on link_clicks;
create policy "clicks_admin_read" on link_clicks for select to authenticated
  using (true);

-- Avaliações: admin pode tudo
drop policy if exists "avaliacoes_admin_all" on avaliacoes;
create policy "avaliacoes_admin_all" on avaliacoes for all to authenticated
  using (true) with check (true);

-- ============================================================
-- Conferência: lista todas as políticas ativas
-- ============================================================
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
