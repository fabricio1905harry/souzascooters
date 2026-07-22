import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Bike,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  Hourglass,
  Play,
  Timer,
  Users,
  Wrench,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { ETAPA_BADGE_CLASSES, ETAPA_LABELS, formatData, formatPreco } from '../../lib/helpers'
import type { Lead, Moto, MotoBaixa, MotoStatus } from '../../types'
import Spinner from '../../components/ui/Spinner'
import { HorizontalBarChart, MonthlyBarChart } from '../../components/admin/DashboardCharts'

type BaixaComMoto = MotoBaixa & {
  moto: Pick<Moto, 'marca' | 'modelo' | 'created_at'> | null
}
type LeadComMoto = Lead & { moto: Pick<Moto, 'marca' | 'modelo'> | null }

const LEAD_TIPO_LABELS: Record<Lead['tipo'], string> = {
  interesse: 'Interesse',
  test_drive: 'Test drive',
  financiamento: 'Financiamento',
}

const DIAS_PARADA = 60 // alerta para motos disponíveis há mais de X dias

function diasDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

function diasEntre(inicioIso: string, fimIso: string): number {
  return Math.max(
    0,
    Math.round((new Date(fimIso).getTime() - new Date(inicioIso).getTime()) / 86_400_000)
  )
}

function KPICard({
  titulo,
  valor,
  icon: Icon,
  destaque = false,
}: {
  titulo: string
  valor: string | number
  icon: typeof Bike
  destaque?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        destaque ? 'border-primary/30 bg-primary-light' : 'border-border bg-surface'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-sm ${destaque ? 'text-primary-dark' : 'text-muted'}`}>{titulo}</p>
        <Icon className={`h-5 w-5 ${destaque ? 'text-primary-dark' : 'text-primary'}`} />
      </div>
      <p className={`mt-2 text-3xl font-bold ${destaque ? 'text-primary-dark' : 'text-text'}`}>
        {valor}
      </p>
    </div>
  )
}

const MESES_GRAFICO = 6

/** Últimos N meses no formato "jan", "fev"... terminando no mês atual. */
function ultimosMeses(n: number): { chave: string; label: string }[] {
  const out: { chave: string; label: string }[] = []
  const hoje = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    out.push({
      chave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
    })
  }
  return out
}

export default function Dashboard() {
  const [motos, setMotos] = useState<Moto[]>([])
  const [baixas, setBaixas] = useState<BaixaComMoto[]>([])
  const [leads, setLeads] = useState<LeadComMoto[]>([])
  const [leadsTipos, setLeadsTipos] = useState<Lead['tipo'][]>([])
  const [leadsSemana, setLeadsSemana] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const seteDiasAtras = new Date(Date.now() - 7 * 86_400_000).toISOString()

      const [motosRes, baixasRes, leadsRes, leadsCount, leadsTiposRes] = await Promise.all([
        supabase.from('motos').select('*'),
        supabase.from('moto_baixas').select('*, moto:motos(marca, modelo, created_at)'),
        supabase
          .from('leads')
          .select('*, moto:motos(marca, modelo)')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .gt('created_at', seteDiasAtras),
        supabase.from('leads').select('tipo'),
      ])

      setMotos((motosRes.data as Moto[]) ?? [])
      setBaixas((baixasRes.data as BaixaComMoto[]) ?? [])
      setLeads((leadsRes.data as LeadComMoto[]) ?? [])
      setLeadsSemana(leadsCount.count ?? 0)
      setLeadsTipos(((leadsTiposRes.data as { tipo: Lead['tipo'] }[]) ?? []).map((l) => l.tipo))
      setLoading(false)
    }

    fetchData()
  }, [])

  // ----- Séries mensais: vendas (contagem) e faturamento (soma do valor real de venda) -----
  const meses = useMemo(() => ultimosMeses(MESES_GRAFICO), [])

  const vendasPorMes = useMemo(() => {
    const porChave = new Map<string, number>()
    for (const b of baixas) {
      if (!b.data_venda) continue
      const chave = b.data_venda.slice(0, 7)
      porChave.set(chave, (porChave.get(chave) ?? 0) + 1)
    }
    return meses.map((m) => ({ label: m.label, value: porChave.get(m.chave) ?? 0 }))
  }, [baixas, meses])

  const faturamentoPorMes = useMemo(() => {
    const porChave = new Map<string, number>()
    for (const b of baixas) {
      if (!b.data_venda || b.valor_venda == null) continue
      const chave = b.data_venda.slice(0, 7)
      porChave.set(chave, (porChave.get(chave) ?? 0) + b.valor_venda)
    }
    return meses.map((m) => ({ label: m.label, value: porChave.get(m.chave) ?? 0 }))
  }, [baixas, meses])

  // ----- Motos por status -----
  const STATUS_ORDEM: MotoStatus[] = ['disponivel', 'reservado', 'manutencao', 'vendido']
  const STATUS_ICONS: Record<MotoStatus, React.ReactNode> = {
    disponivel: <CheckCircle2 className="h-3.5 w-3.5" />,
    reservado: <CalendarClock className="h-3.5 w-3.5" />,
    manutencao: <Wrench className="h-3.5 w-3.5" />,
    vendido: <Bike className="h-3.5 w-3.5" />,
  }
  const STATUS_CHART_LABELS: Record<MotoStatus, string> = {
    disponivel: 'Disponível',
    reservado: 'Reservado',
    manutencao: 'Manutenção',
    vendido: 'Vendido',
  }
  const STATUS_CHART_CORES: Record<MotoStatus, string> = {
    disponivel: '#10B981',
    reservado: '#F59E0B',
    manutencao: '#6B7280',
    vendido: '#EF4444',
  }
  const motosPorStatus = useMemo(() => {
    const contagem: Record<MotoStatus, number> = {
      disponivel: 0,
      reservado: 0,
      manutencao: 0,
      vendido: 0,
    }
    for (const m of motos) contagem[m.status]++
    return STATUS_ORDEM.map((s) => ({
      label: STATUS_CHART_LABELS[s],
      value: contagem[s],
      color: STATUS_CHART_CORES[s],
      icon: STATUS_ICONS[s],
    }))
  }, [motos])

  // ----- Leads por tipo -----
  const LEAD_TIPO_CORES: Record<Lead['tipo'], string> = {
    interesse: '#4D5F9C',
    financiamento: '#C88A0E',
    test_drive: '#1B8A5A',
  }
  const leadsPorTipo = useMemo(() => {
    const contagem: Record<Lead['tipo'], number> = { interesse: 0, test_drive: 0, financiamento: 0 }
    for (const t of leadsTipos) contagem[t]++
    return (Object.keys(contagem) as Lead['tipo'][]).map((t) => ({
      label: LEAD_TIPO_LABELS[t],
      value: contagem[t],
      color: LEAD_TIPO_CORES[t],
    }))
  }, [leadsTipos])

  if (loading) return <Spinner />

  // ----- Estoque -----
  const emEstoque = motos.filter((m) => m.status !== 'vendido')
  const disponiveis = motos.filter((m) => m.status === 'disponivel')
  const reservadas = motos.filter((m) => m.status === 'reservado')

  // Motos paradas: disponíveis há mais de N dias DESDE O CADASTRO
  const paradas = disponiveis
    .map((m) => ({ ...m, dias: diasDesde(m.created_at) }))
    .filter((m) => m.dias > DIAS_PARADA)
    .sort((a, b) => b.dias - a.dias)

  // ----- Despachante / baixas -----
  const baixasNovas = baixas.filter((b) => b.etapa === 'nova')
  const baixasAndamento = baixas.filter((b) => b.etapa === 'em_andamento')
  const baixasConcluidas = baixas.filter((b) => b.etapa === 'concluida')
  const baixasPendentes = [...baixasNovas, ...baixasAndamento].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // Tempo médio do cadastro até a venda (created_at da moto → data_venda)
  const temposVenda = baixas
    .filter((b) => b.data_venda && b.moto?.created_at)
    .map((b) => diasEntre(b.moto!.created_at, b.data_venda!))
  const tempoMedioVenda =
    temposVenda.length > 0
      ? Math.round(temposVenda.reduce((s, d) => s + d, 0) / temposVenda.length)
      : null

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold uppercase text-text">Dashboard</h1>

      {/* KPIs do estoque */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard titulo="Motos no estoque" valor={emEstoque.length} icon={Bike} />
        <KPICard titulo="Disponíveis" valor={disponiveis.length} icon={CheckCircle2} />
        <KPICard titulo="Reservadas" valor={reservadas.length} icon={CalendarClock} />
        <KPICard titulo="Leads esta semana" valor={leadsSemana} icon={Users} />
      </div>

      {/* KPIs do despachante */}
      <h2 className="mb-3 mt-8 flex items-center gap-2 font-semibold text-text">
        <ClipboardList className="h-5 w-5 text-primary" /> Gestão de baixas (despachante)
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard titulo="Novas para baixa" valor={baixasNovas.length} icon={Hourglass} destaque={baixasNovas.length > 0} />
        <KPICard titulo="Em andamento" valor={baixasAndamento.length} icon={Play} />
        <KPICard titulo="Concluídas" valor={baixasConcluidas.length} icon={CheckCircle2} />
        <KPICard
          titulo="Tempo médio até vender"
          valor={tempoMedioVenda !== null ? `${tempoMedioVenda}d` : '—'}
          icon={Timer}
        />
      </div>

      {/* Gráficos */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <MonthlyBarChart
          title="Vendas por mês"
          subtitle={`Motos vendidas nos últimos ${MESES_GRAFICO} meses`}
          data={vendasPorMes}
          color="#4D5F9C"
        />
        <MonthlyBarChart
          title="Faturamento por mês"
          subtitle="Soma do valor real de venda"
          data={faturamentoPorMes}
          color="#C88A0E"
          valueFormatter={formatPreco}
        />
        <HorizontalBarChart
          title="Motos por status"
          subtitle="Distribuição atual do estoque"
          data={motosPorStatus}
        />
        <HorizontalBarChart title="Leads por tipo" subtitle="Total histórico" data={leadsPorTipo} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Motos paradas há muito tempo (desde o cadastro) */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-1 flex items-center gap-2 font-semibold text-text">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Paradas há mais de {DIAS_PARADA} dias
          </h2>
          <p className="mb-4 text-xs text-muted">
            Disponíveis no estoque, contando desde a data de cadastro
          </p>
          {paradas.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma moto parada. 🎉</p>
          ) : (
            <ul className="divide-y divide-border">
              {paradas.map((moto) => (
                <li key={moto.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">
                      {moto.marca} {moto.modelo}
                    </p>
                    <p className="text-xs text-muted">
                      Cadastrada em {formatData(moto.created_at)} · {formatPreco(moto.preco)}
                    </p>
                  </div>
                  <span
                    className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      moto.dias > DIAS_PARADA * 2
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {moto.dias} dias
                  </span>
                  <Link
                    to={`/admin/estoque/${moto.id}/editar`}
                    className="whitespace-nowrap text-sm font-medium text-primary hover:text-primary-dark"
                  >
                    Ver
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Baixas pendentes */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-1 flex items-center gap-2 font-semibold text-text">
            <Clock className="h-5 w-5 text-primary" />
            Baixas pendentes
          </h2>
          <p className="mb-4 text-xs text-muted">
            Vendas aguardando o despachante ou em transferência
          </p>
          {baixasPendentes.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma baixa pendente. 🎉</p>
          ) : (
            <ul className="divide-y divide-border">
              {baixasPendentes.map((baixa) => (
                <li key={baixa.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">
                      {baixa.moto ? `${baixa.moto.marca} ${baixa.moto.modelo}` : 'Moto'}
                      <span className="font-normal text-muted"> → {baixa.nome_comprador}</span>
                    </p>
                    <p className="text-xs text-muted">
                      {baixa.data_venda
                        ? `Vendida em ${formatData(baixa.data_venda)} · há ${diasDesde(baixa.data_venda)} dias`
                        : `Registrada em ${formatData(baixa.created_at)}`}
                    </p>
                  </div>
                  <span
                    className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${ETAPA_BADGE_CLASSES[baixa.etapa]}`}
                  >
                    {ETAPA_LABELS[baixa.etapa]}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {baixasPendentes.length > 0 && (
            <Link
              to="/admin/baixas"
              className="mt-3 block text-center text-sm font-medium text-primary hover:text-primary-dark"
            >
              Ver todas as baixas →
            </Link>
          )}
        </section>

        {/* Atividade recente */}
        <section className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-text">
            <Users className="h-5 w-5 text-primary" />
            Últimos leads
          </h2>
          {leads.length === 0 ? (
            <p className="text-sm text-muted">Nenhum lead ainda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {leads.map((lead) => (
                <li key={lead.id} className="py-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-text">
                      {lead.nome ?? 'Anônimo'} · {LEAD_TIPO_LABELS[lead.tipo]}
                    </p>
                    <p className="text-xs text-muted">{formatData(lead.created_at)}</p>
                  </div>
                  {lead.moto && (
                    <p className="text-xs text-muted">
                      {lead.moto.marca} {lead.moto.modelo}
                    </p>
                  )}
                  {lead.telefone && <p className="text-xs text-muted">{lead.telefone}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
