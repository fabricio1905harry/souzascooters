-- Torna dinâmico o número de parcelas exibido no catálogo
-- (hoje fixo em "até 21x no cartão / até 48x financiamento")
alter table lojas
  add column if not exists parcelas_cartao integer not null default 21,
  add column if not exists parcelas_financiamento integer not null default 48;
