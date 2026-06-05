import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { ETAPA_BADGE_CLASSES, ETAPA_LABELS, formatData, formatPreco } from '../../lib/helpers'
import type { Lead, Moto, MotoBaixa } from '../../types'
import Spinner from '../../components/ui/Spinner'

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

export default function Dashboard() {
  const [motos, setMotos] = useState<Moto[]>([])
  const [baixas, setBaixas] = useState<BaixaComMoto[]>([])
  const [leads, setLeads] = useState<LeadComMoto[]>([])
  const [leadsSemana, setLeadsSemana] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const seteDiasAtras = new Date(Date.now() - 7 * 86_400_000).toISOString()

      const [motosRes, baixasRes, leadsRes, leadsCount] = await Promise.all([
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
      ])

      setMotos((motosRes.data as Moto[]) ?? [])
      setBaixas((baixasRes.data as BaixaComMoto[]) ?? [])
      setLeads((leadsRes.data as LeadComMoto[]) ?? [])
      setLeadsSemana(leadsCount.count ?? 0)
      setLoading(false)
    }

    fetchData()
  }, [])

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
      <h1 className="mb-6 text-2xl font-bold text-text">Dashboard</h1>

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
