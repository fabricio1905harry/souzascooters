-- ============================================================
-- MELHORIA DO PROCESSO DE BAIXA — etapas do fluxo
-- Execute no SQL Editor do Supabase. Seguro para rodar sempre.
--
-- Fluxo: admin clica "Vender" no estoque → preenche dados do novo
-- dono + documentos (CNH, comprovante etc.) → baixa entra como
-- 'nova' → despachante "inicia o processo" ('em_andamento', dados
-- liberados) → ao final 'concluida'.
-- ============================================================

alter table moto_baixas add column if not exists etapa text not null default 'nova';
alter table moto_baixas drop constraint if exists moto_baixas_etapa_check;
alter table moto_baixas add constraint moto_baixas_etapa_check
  check (etapa in ('nova', 'em_andamento', 'concluida'));

alter table moto_baixas add column if not exists iniciado_por uuid references auth.users(id);
alter table moto_baixas add column if not exists iniciado_em timestamptz;
alter table moto_baixas add column if not exists concluido_em timestamptz;

-- Migra baixas antigas: concluídas mantêm o estado
update moto_baixas
set etapa = 'concluida',
    concluido_em = coalesce(concluido_em, updated_at)
where baixa_concluida = true and etapa = 'nova';

-- Conferência
select etapa, count(*) from moto_baixas group by etapa;
