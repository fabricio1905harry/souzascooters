-- ============================================================
-- ATUALIZAÇÃO + DADOS DE EXEMPLO — Souza Scooters
-- Execute este arquivo inteiro no SQL Editor do Supabase.
-- (Seguro para rodar mais de uma vez)
-- ============================================================

-- 1. Atualizar a loja (empresa única) — dados reais
update lojas set
  nome = 'Souza Scooters',
  slug = 'souza-scooters',
  slogan = 'COMPRA • VENDA • TROCA • FINANCIA',
  instagram = '@souza.scooters';

-- 2. Políticas RLS que faltaram na primeira versão do schema
--    (sem elas o admin logado não lê a loja nem gerencia os links)
drop policy if exists "lojas_admin_read" on lojas;
create policy "lojas_admin_read" on lojas for select to authenticated
  using (true);

drop policy if exists "links_admin_all" on loja_links;
create policy "links_admin_all" on loja_links for all to authenticated
  using (true) with check (true);

drop policy if exists "clicks_admin_read" on link_clicks;
create policy "clicks_admin_read" on link_clicks for select to authenticated
  using (true);

-- 3. Links de exemplo da link page (só insere se ainda não houver links)
insert into loja_links (loja_id, titulo, url, icone, ordem)
select l.id, v.titulo, v.url, v.icone, v.ordem
from lojas l,
(values
  ('Fale com o Vinicius no WhatsApp',          'https://wa.me/5511999999999', 'MessageCircle', 0),
  ('Instagram @souza.scooters',                'https://instagram.com/souza.scooters', 'Instagram', 1),
  ('Cartão até 21x | Financiamento até 48x',   'https://wa.me/5511999999999?text=Quero+simular+um+financiamento', 'CreditCard', 2),
  ('Como chegar',                              'https://maps.google.com/?q=Souza+Scooters', 'MapPin', 3)
) as v(titulo, url, icone, ordem)
where not exists (select 1 from loja_links);

-- 4. Veículos de exemplo (só insere se o estoque estiver vazio)
insert into motos (loja_id, marca, modelo, ano_fab, ano_mod, cor, quilometragem,
                   preco, categoria, cilindrada, combustivel, placa, descricao,
                   status, destaque, publicado)
select l.id, v.marca, v.modelo, v.ano_fab, v.ano_mod, v.cor, v.quilometragem,
       v.preco, v.categoria, v.cilindrada, v.combustivel, v.placa, v.descricao,
       v.status, v.destaque, v.publicado
from lojas l,
(values
  ('Honda',  'PCX 160',            2023, 2023, 'Branca',     8500,  17900.00, 'scooter',  160, 'gasolina', 'BRA2E19',
   'Único dono, revisões em dia na concessionária. Pneus novos, baú Givi 45L incluso.',
   'disponivel', true,  true),

  ('Yamaha', 'NMAX Connect 160',   2022, 2023, 'Cinza',      12300, 16500.00, 'scooter',  160, 'gasolina', 'RTC4F88',
   'ABS, painel com conectividade Y-Connect. Manual e chave reserva.',
   'disponivel', true,  true),

  ('Honda',  'Biz 125',            2021, 2021, 'Vermelha',   18900, 12900.00, 'scooter',  125, 'flex',     'QPM7G21',
   'Partida elétrica, baú original. Ideal para o dia a dia, baixo consumo.',
   'disponivel', false, true),

  ('Honda',  'Elite 125',          2023, 2024, 'Preta',      3200,  11500.00, 'scooter',  125, 'gasolina', 'SDF9H34',
   'Praticamente zero, na garantia de fábrica. Aceita troca.',
   'disponivel', true,  true),

  ('Honda',  'ADV 150',            2021, 2022, 'Vermelha',   15600, 18900.00, 'scooter',  150, 'gasolina', 'RKL3J56',
   'O SUV das scooters. Suspensão reforçada, parabrisa ajustável.',
   'reservado',  false, true),

  ('Yamaha', 'Fluo 125 ABS',       2022, 2022, 'Azul',       9800,  10900.00, 'scooter',  125, 'gasolina', 'TGB5K12',
   'ABS de série, piso plano, ótimo custo-benefício para entregas e cidade.',
   'disponivel', false, true),

  ('Voltz',  'EV1 Sport',          2023, 2023, 'Preta',      4100,  13900.00, 'eletrica', null, 'eletrica', 'SXZ8L77',
   'Scooter 100% elétrica, 2 baterias removíveis, autonomia de até 180 km. Zero combustível, zero IPVA em SP.',
   'disponivel', true,  true),

  ('Honda',  'CB 250F Twister',    2020, 2020, 'Amarela',    27400, 15500.00, 'street',   250, 'flex',     'QWE1M90',
   'Flex, injeção eletrônica. Escapamento esportivo, manutenção em dia.',
   'disponivel', false, true),

  ('Yamaha', 'Fazer FZ25 ABS',     2022, 2023, 'Grafite',    11200, 18500.00, 'street',   250, 'flex',     'RVB6N43',
   'ABS nas duas rodas, farol full LED. Pneus meia-vida, sem detalhes.',
   'manutencao', false, true),

  ('Honda',  'PCX 150',            2019, 2019, 'Prata',      31500, 12500.00, 'scooter',  150, 'gasolina', 'PLO2P65',
   'Bem conservada, ótima entrada para quem busca scooter premium.',
   'vendido',    false, true),

  ('Suzuki', 'Burgman Street 125', 2023, 2023, 'Branca',     2100,  11900.00, 'scooter',  125, 'gasolina', 'TMN4Q18',
   'Em preparação para anúncio — fotos pendentes.',
   'disponivel', false, false)
) as v(marca, modelo, ano_fab, ano_mod, cor, quilometragem, preco, categoria,
       cilindrada, combustivel, placa, descricao, status, destaque, publicado)
where not exists (select 1 from motos);
