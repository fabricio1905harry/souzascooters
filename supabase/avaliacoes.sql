-- ============================================================
-- AVALIAÇÕES DO GOOGLE — execute no SQL Editor do Supabase
-- (Seguro para rodar mais de uma vez)
-- ============================================================

-- Resumo da nota no Google (exibido como selo no topo da link page)
alter table lojas add column if not exists google_rating numeric(2,1);
alter table lojas add column if not exists google_review_count integer;
alter table lojas add column if not exists google_url text;

-- Avaliações individuais (copiadas do perfil do Google pelo admin)
create table if not exists avaliacoes (
  id uuid primary key default uuid_generate_v4(),
  loja_id uuid references lojas(id) on delete cascade,
  autor text not null,
  nota smallint not null check (nota between 1 and 5),
  texto text,
  data_avaliacao date,
  exibir boolean default true,
  created_at timestamptz default now()
);

alter table avaliacoes enable row level security;

drop policy if exists "avaliacoes_public_read" on avaliacoes;
create policy "avaliacoes_public_read" on avaliacoes for select to anon
  using (exibir = true);

drop policy if exists "avaliacoes_admin_all" on avaliacoes;
create policy "avaliacoes_admin_all" on avaliacoes for all to authenticated
  using (true) with check (true);

-- Cor principal da marca (azul Souza Scooters)
update lojas set cor_primaria = '#4D5F9C';

-- Valores iniciais do selo (nota real do perfil: 5 estrelas)
update lojas set
  google_rating = 5.0,
  google_url = coalesce(google_url, 'https://www.google.com/search?q=souza+scooters');

-- Avaliações de exemplo (só insere se a tabela estiver vazia)
insert into avaliacoes (loja_id, autor, nota, texto, data_avaliacao)
select l.id, v.autor, v.nota, v.texto, v.data_avaliacao::date
from lojas l,
(values
  ('Carlos M.',   5, 'Atendimento excelente, moto entregue revisada e com documentação em dia. Recomendo demais!', '2026-04-12'),
  ('Fernanda S.', 5, 'Comprei minha PCX com o Vinicius, super atencioso e honesto. Financiamento aprovado na hora.', '2026-03-28'),
  ('Roberto A.',  5, 'Troquei minha moto antiga na negociação, avaliação justa. Loja de confiança.', '2026-05-02')
) as v(autor, nota, texto, data_avaliacao)
where not exists (select 1 from avaliacoes);
