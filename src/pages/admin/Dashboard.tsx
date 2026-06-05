import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Bike, CalendarClock, CheckCircle2, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatData } from '../../lib/helpers'
import type { Lead, Moto } from '../../types'
import Spinner from '../../components/ui/Spinner'

interface KPIs {
  total: number
  disponiveis: number
  reservadas: number
  leadsSemana: number
}

const LEAD_TIPO_LABELS: Record<Lead['tipo'], string> = {
  interesse: 'Interesse',
  test_drive: 'Test drive',
  financiamento: 'Financiamento',
}

function KPICard({
  titulo,
  valor,
  icon: Icon,
}: {
  titulo: string
  valor: number
  icon: typeof Bike
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{titulo}</p>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="mt-2 text-3xl font-bold text-text">{valor}</p>
    </div>
  )
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [paradas, setParadas] = useState<Moto[]>([])
  const [leads, setLeads] = useState<(Lead & { moto?: Pick<Moto, 'marca' | 'modelo'> | null })[]>([])

  useEffect(() => {
    async function fetchData() {
      const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const sessentaDiasAtras = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

      const [total, disponiveis, reservadas, leadsSemana, paradasRes, leadsRes] =
        await Promise.all([
          supabase.from('motos').select('id', { count: 'exact', head: true }).neq('status', 'vendido'),
          supabase.from('motos').select('id', { count: 'exact', head: true }).eq('status', 'disponivel'),
          supabase.from('motos').select('id', { count: 'exact', head: true }).eq('status', 'reservado'),
          supabase.from('leads').select('id', { count: 'exact', head: true }).gt('created_at', seteDiasAtras),
          supabase
            .from('motos')
            .select('*')
            .eq('status', 'disponivel')
            .lt('updated_at', sessentaDiasAtras)
            .order('updated_at'),
          supabase
            .from('leads')
            .select('*, moto:motos(marca, modelo)')
            .order('created_at', { ascending: false })
            .limit(5),
        ])

      setKpis({
        total: total.count ?? 0,
        disponiveis: disponiveis.count ?? 0,
        reservadas: reservadas.count ?? 0,
        leadsSemana: leadsSemana.count ?? 0,
      })
      setParadas((paradasRes.data as Moto[]) ?? [])
      setLeads((leadsRes.data as typeof leads) ?? [])
    }

    fetchData()
  }, [])

  if (!kpis) return <Spinner />

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard titulo="Motos no estoque" valor={kpis.total} icon={Bike} />
        <KPICard titulo="Disponíveis" valor={kpis.disponiveis} icon={CheckCircle2} />
        <KPICard titulo="Reservadas" valor={kpis.reservadas} icon={CalendarClock} />
        <KPICard titulo="Leads esta semana" valor={kpis.leadsSemana} icon={Users} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Alertas: motos paradas há mais de 60 dias */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-text">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Paradas há mais de 60 dias
          </h2>
          {paradas.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma moto parada. 🎉</p>
          ) : (
            <ul className="divide-y divide-border">
              {paradas.map((moto) => (
                <li key={moto.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-text">
                      {moto.marca} {moto.modelo}
                    </p>
                    <p className="text-xs text-muted">
                      Sem movimentação desde {formatData(moto.updated_at)}
                    </p>
                  </div>
                  <Link
                    to={`/admin/estoque/${moto.id}/editar`}
                    className="text-sm font-medium text-primary hover:text-primary-dark"
                  >
                    Ver
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Atividade recente */}
        <section className="rounded-xl border border-border bg-surface p-5">
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
