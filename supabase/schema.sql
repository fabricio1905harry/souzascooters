-- Habilitar extensões
create extension if not exists "uuid-ossp";

-- Tabela da loja (empresa única — o app usa a primeira loja ativa)
create table lojas (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  slug text unique not null,          -- usado na URL: /loja/moto-express
  logo_url text,
  capa_url text,
  slogan text,
  whatsapp text,                       -- número com DDI: 5511999999999
  instagram text,
  facebook text,
  site_url text,
  endereco text,
  cidade text,
  uf char(2),
  cor_primaria text default '#1D9E75', -- hex da cor da loja
  ativo boolean default true,
  created_at timestamptz default now()
);

-- Tabela de links da link page
create table loja_links (
  id uuid primary key default uuid_generate_v4(),
  loja_id uuid references lojas(id) on delete cascade,
  titulo text not null,
  url text not null,
  icone text,                          -- nome do ícone Lucide
  ordem smallint default 0,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- Tabela principal de motos
create table motos (
  id uuid primary key default uuid_generate_v4(),
  loja_id uuid references lojas(id) on delete cascade,
  marca text not null,
  modelo text not null,
  ano_fab smallint not null,
  ano_mod smallint not null,
  cor text,
  quilometragem integer,
  preco numeric(12,2) not null,
  categoria text,                      -- street | trail | custom | scooter | eletrica | naked
  cilindrada smallint,
  combustivel text default 'gasolina', -- gasolina | flex | eletrica
  placa text,                          -- SOMENTE admin, nunca expor na API pública
  chassi text,                         -- SOMENTE admin
  descricao text,
  status text default 'disponivel',    -- disponivel | reservado | vendido | manutencao
  destaque boolean default false,
  publicado boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Atualizar updated_at automaticamente
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger motos_updated_at
  before update on motos
  for each row execute function update_updated_at();

-- Tabela de fotos das motos
create table moto_fotos (
  id uuid primary key default uuid_generate_v4(),
  moto_id uuid references motos(id) on delete cascade,
  storage_path text not null,          -- ex: motos-fotos/loja-id/moto-id/foto.jpg
  ordem smallint default 0,            -- 0 = foto principal
  created_at timestamptz default now()
);

-- Tabela de documentos das motos (acesso restrito)
create table moto_documentos (
  id uuid primary key default uuid_generate_v4(),
  moto_id uuid references motos(id) on delete cascade,
  tipo text not null,                  -- dut | crlv | laudo | nf | outro
  nome_arquivo text not null,
  storage_path text not null,          -- bucket privado: motos-docs
  tamanho_bytes bigint,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Tabela de leads (interesse, test drive, financiamento)
create table leads (
  id uuid primary key default uuid_generate_v4(),
  loja_id uuid references lojas(id) on delete cascade,
  moto_id uuid references motos(id) on delete set null,
  tipo text not null,                  -- interesse | test_drive | financiamento
  nome text,
  telefone text,
  mensagem text,
  created_at timestamptz default now()
);

-- Tabela de analytics (cliques em links)
create table link_clicks (
  id uuid primary key default uuid_generate_v4(),
  loja_id uuid references lojas(id) on delete cascade,
  link_id uuid references loja_links(id) on delete set null,
  moto_id uuid references motos(id) on delete set null,
  tipo text,                           -- link | whatsapp | catalogo | moto_detalhe
  created_at timestamptz default now()
);

-- ============================================================
-- RLS — Row Level Security
-- ============================================================

alter table lojas enable row level security;
alter table loja_links enable row level security;
alter table motos enable row level security;
alter table moto_fotos enable row level security;
alter table moto_documentos enable row level security;
alter table leads enable row level security;
alter table link_clicks enable row level security;

-- Políticas para visitantes (anon): leitura somente de dados públicos

-- Lojas: anon pode ler lojas ativas
create policy "lojas_public_read" on lojas for select to anon
  using (ativo = true);

-- Links: anon pode ler links ativos
create policy "links_public_read" on loja_links for select to anon
  using (ativo = true);

-- Motos: anon vê apenas publicadas, disponíveis ou reservadas, SEM placa e chassi
-- (filtro de colunas via view abaixo)
create policy "motos_public_read" on motos for select to anon
  using (publicado = true and status in ('disponivel', 'reservado'));

-- Fotos: anon pode ver fotos de motos publicadas
create policy "fotos_public_read" on moto_fotos for select to anon
  using (
    exists (
      select 1 from motos m
      where m.id = moto_fotos.moto_id
        and m.publicado = true
    )
  );

-- Documentos: anon NUNCA acessa
create policy "docs_no_anon" on moto_documentos for select to anon
  using (false);

-- Leads: anon pode inserir (formulário público)
create policy "leads_public_insert" on leads for insert to anon
  with check (true);

-- Clicks: anon pode inserir
create policy "clicks_public_insert" on link_clicks for insert to anon
  with check (true);

-- Políticas para authenticated (admin da loja): acesso total à própria loja
-- Usar uma tabela auxiliar ou claim no JWT para guardar o loja_id do usuário
-- Por simplicidade no MVP: authenticated acessa tudo (refinar com claims depois)

create policy "motos_admin_all" on motos for all to authenticated
  using (true) with check (true);

create policy "fotos_admin_all" on moto_fotos for all to authenticated
  using (true) with check (true);

create policy "docs_admin_all" on moto_documentos for all to authenticated
  using (true) with check (true);

create policy "leads_admin_read" on leads for select to authenticated
  using (true);

create policy "lojas_admin_update" on lojas for update to authenticated
  using (true) with check (true);

-- Admin precisa ler a própria loja (políticas "to anon" não valem para authenticated)
create policy "lojas_admin_read" on lojas for select to authenticated
  using (true);

-- Admin gerencia os links da link page
create policy "links_admin_all" on loja_links for all to authenticated
  using (true) with check (true);

-- Admin pode ler analytics de cliques
create policy "clicks_admin_read" on link_clicks for select to authenticated
  using (true);

-- ============================================================
-- View pública sem dados sensíveis (placa, chassi)
-- ============================================================
create or replace view motos_publicas as
  select
    id, loja_id, marca, modelo, ano_fab, ano_mod,
    cor, quilometragem, preco, categoria, cilindrada,
    combustivel, descricao, status, destaque,
    created_at, updated_at
  from motos
  where publicado = true
    and status in ('disponivel', 'reservado');

-- ============================================================
-- Dados de exemplo (loja demo)
-- ============================================================
insert into lojas (nome, slug, slogan, whatsapp, instagram, cor_primaria)
values (
  'Souza Scooters',
  'souza-scooters',
  'Scooters e motos com procedência',
  '5511999999999',
  '@souzascooters',
  '#1D9E75'
);
