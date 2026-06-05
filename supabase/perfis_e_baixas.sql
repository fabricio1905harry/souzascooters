-- ============================================================
-- PERFIS (níveis de acesso) + SISTEMA DE BAIXA DE VEÍCULOS
-- Execute no SQL Editor do Supabase. Seguro para rodar sempre.
--
-- Papéis:
--   admin       → acesso total ao painel
--   despachante → vê SOMENTE motos vendidas e registra a baixa
--                 (dados do novo dono / transferência)
-- ============================================================

-- 1. Tabela de perfis (1 linha por usuário do Auth)
create table if not exists perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  papel text not null default 'admin' check (papel in ('admin', 'despachante')),
  created_at timestamptz default now()
);

alter table perfis enable row level security;

-- Função auxiliar: papel do usuário logado.
-- security definer evita recursão de RLS ao consultar perfis.
create or replace function papel_usuario()
returns text
language sql stable security definer
set search_path = public
as $$
  select papel from perfis where id = auth.uid()
$$;

-- Cada usuário lê o próprio perfil
drop policy if exists "perfis_self_read" on perfis;
create policy "perfis_self_read" on perfis for select to authenticated
  using (id = auth.uid());

-- Admin gerencia todos os perfis
drop policy if exists "perfis_admin_all" on perfis;
create policy "perfis_admin_all" on perfis for all to authenticated
  using (papel_usuario() = 'admin') with check (papel_usuario() = 'admin');

-- Usuários já existentes no Auth viram admin (não sobrescreve)
insert into perfis (id, nome, papel)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', u.email), 'admin'
from auth.users u
on conflict (id) do nothing;

-- 2. Tabela de baixas (dados do novo dono do veículo)
create table if not exists moto_baixas (
  id uuid primary key default uuid_generate_v4(),
  moto_id uuid unique not null references motos(id) on delete cascade,
  nome_comprador text not null,
  cpf text,
  telefone text,
  email text,
  endereco text,
  cidade text,
  uf char(2),
  data_venda date,
  valor_venda numeric(12,2),
  observacoes text,
  baixa_concluida boolean default false,   -- transferência/documentação finalizada
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists moto_baixas_updated_at on moto_baixas;
create trigger moto_baixas_updated_at
  before update on moto_baixas
  for each row execute function update_updated_at();

alter table moto_baixas enable row level security;

-- Admin: tudo
drop policy if exists "baixas_admin_all" on moto_baixas;
create policy "baixas_admin_all" on moto_baixas for all to authenticated
  using (papel_usuario() = 'admin') with check (papel_usuario() = 'admin');

-- Despachante: lê, cria e edita baixas
drop policy if exists "baixas_despachante_read" on moto_baixas;
create policy "baixas_despachante_read" on moto_baixas for select to authenticated
  using (papel_usuario() = 'despachante');

drop policy if exists "baixas_despachante_insert" on moto_baixas;
create policy "baixas_despachante_insert" on moto_baixas for insert to authenticated
  with check (papel_usuario() = 'despachante');

drop policy if exists "baixas_despachante_update" on moto_baixas;
create policy "baixas_despachante_update" on moto_baixas for update to authenticated
  using (papel_usuario() = 'despachante') with check (papel_usuario() = 'despachante');

-- 3. Reescrever políticas de MOTOS por papel
--    admin → tudo · despachante → SOMENTE leitura de vendidas
drop policy if exists "motos_admin_all" on motos;
create policy "motos_admin_all" on motos for all to authenticated
  using (papel_usuario() = 'admin') with check (papel_usuario() = 'admin');

drop policy if exists "motos_despachante_read" on motos;
create policy "motos_despachante_read" on motos for select to authenticated
  using (papel_usuario() = 'despachante' and status = 'vendido');

-- 4. Fotos: admin tudo · despachante vê fotos das vendidas
drop policy if exists "fotos_admin_all" on moto_fotos;
create policy "fotos_admin_all" on moto_fotos for all to authenticated
  using (papel_usuario() = 'admin') with check (papel_usuario() = 'admin');

drop policy if exists "fotos_despachante_read" on moto_fotos;
create policy "fotos_despachante_read" on moto_fotos for select to authenticated
  using (
    papel_usuario() = 'despachante'
    and exists (select 1 from motos m where m.id = moto_id and m.status = 'vendido')
  );

-- 5. Documentos: admin tudo · despachante vê e envia docs das vendidas
drop policy if exists "docs_admin_all" on moto_documentos;
create policy "docs_admin_all" on moto_documentos for all to authenticated
  using (papel_usuario() = 'admin') with check (papel_usuario() = 'admin');

drop policy if exists "docs_despachante_read" on moto_documentos;
create policy "docs_despachante_read" on moto_documentos for select to authenticated
  using (
    papel_usuario() = 'despachante'
    and exists (select 1 from motos m where m.id = moto_id and m.status = 'vendido')
  );

drop policy if exists "docs_despachante_insert" on moto_documentos;
create policy "docs_despachante_insert" on moto_documentos for insert to authenticated
  with check (
    papel_usuario() = 'despachante'
    and exists (select 1 from motos m where m.id = moto_id and m.status = 'vendido')
  );

-- 6. Leads e configurações da loja: somente admin
drop policy if exists "leads_admin_read" on leads;
create policy "leads_admin_read" on leads for select to authenticated
  using (papel_usuario() = 'admin');

drop policy if exists "lojas_admin_update" on lojas;
create policy "lojas_admin_update" on lojas for update to authenticated
  using (papel_usuario() = 'admin') with check (papel_usuario() = 'admin');

-- ============================================================
-- COMO CRIAR UM DESPACHANTE:
-- 1) Dashboard → Authentication → Users → Add user (email + senha)
-- 2) Rode o insert abaixo trocando o e-mail e o nome:
--
-- insert into perfis (id, nome, papel)
-- select id, 'Nome do Despachante', 'despachante'
-- from auth.users where email = 'despachante@email.com'
-- on conflict (id) do update set papel = 'despachante', nome = excluded.nome;
-- ============================================================

-- Conferência
select p.papel, p.nome, u.email
from perfis p join auth.users u on u.id = p.id
order by p.papel;
