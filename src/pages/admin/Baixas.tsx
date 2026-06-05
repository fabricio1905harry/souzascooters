import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Bike, CheckCircle2, ClipboardList, Clock, FileText, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { supabase, getThumbnailUrl } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { formatData, formatPreco } from '../../lib/helpers'
import type { Moto, MotoBaixa } from '../../types'
import Spinner from '../../components/ui/Spinner'

type MotoVendida = Moto & { baixa: MotoBaixa | null }

const baixaSchema = z.object({
  nome_comprador: z.string().min(3, 'Informe o nome do comprador'),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2, 'Use a sigla (ex: SP)').optional(),
  data_venda: z.string().optional(),
  valor_venda: z.coerce.number().positive().optional().or(z.literal('')),
  observacoes: z.string().optional(),
  baixa_concluida: z.boolean(),
})

type BaixaInput = z.input<typeof baixaSchema>
type BaixaValues = z.output<typeof baixaSchema>

function BaixaModal({
  moto,
  onClose,
  onSaved,
}: {
  moto: MotoVendida
  onClose: () => void
  onSaved: () => void
}) {
  const { user } = useAuth()
  const baixa = moto.baixa

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BaixaInput, unknown, BaixaValues>({
    resolver: zodResolver(baixaSchema),
    defaultValues: {
      nome_comprador: baixa?.nome_comprador ?? '',
      cpf: baixa?.cpf ?? '',
      telefone: baixa?.telefone ?? '',
      email: baixa?.email ?? '',
      endereco: baixa?.endereco ?? '',
      cidade: baixa?.cidade ?? '',
      uf: baixa?.uf ?? '',
      data_venda: baixa?.data_venda ?? new Date().toISOString().slice(0, 10),
      valor_venda: baixa?.valor_venda ?? moto.preco,
      observacoes: baixa?.observacoes ?? '',
      baixa_concluida: baixa?.baixa_concluida ?? false,
    },
  })

  async function onSubmit(values: BaixaValues) {
    const payload = {
      moto_id: moto.id,
      nome_comprador: values.nome_comprador,
      cpf: values.cpf || null,
      telefone: values.telefone || null,
      email: values.email || null,
      endereco: values.endereco || null,
      cidade: values.cidade || null,
      uf: values.uf || null,
      data_venda: values.data_venda || null,
      valor_venda: values.valor_venda === '' ? null : values.valor_venda,
      observacoes: values.observacoes || null,
      baixa_concluida: values.baixa_concluida,
      created_by: user?.id ?? null,
    }

    const { data, error } = await supabase
      .from('moto_baixas')
      .upsert(payload, { onConflict: 'moto_id' })
      .select('id')

    if (error) {
      toast.error(`Erro ao salvar baixa: ${error.message}`)
    } else if (!data || data.length === 0) {
      toast.error('Sem permissão para salvar (verifique seu perfil de acesso)')
    } else {
      toast.success('Baixa registrada!')
      onSaved()
      onClose()
    }
  }

  const inputClass =
    'w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none'
  const labelClass = 'mb-1 block text-sm font-medium text-text'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-surface p-6 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">Baixa do veículo</h3>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>
        <p className="mb-5 text-sm text-muted">
          {moto.marca} {moto.modelo} {moto.ano_fab}/{moto.ano_mod}
          {moto.placa && ` · Placa ${moto.placa}`}
          {moto.chassi && ` · Chassi ${moto.chassi}`}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-lg bg-bg p-4">
            <p className="mb-3 text-sm font-semibold text-text">Dados do novo dono</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Nome completo *</label>
                <input {...register('nome_comprador')} className={inputClass} />
                {errors.nome_comprador && (
                  <p className="mt-1 text-xs text-red-600">{errors.nome_comprador.message}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>CPF</label>
                <input {...register('cpf')} className={inputClass} placeholder="000.000.000-00" />
              </div>
              <div>
                <label className={labelClass}>Telefone</label>
                <input {...register('telefone')} className={inputClass} placeholder="(11) 99999-9999" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>E-mail</label>
                <input {...register('email')} className={inputClass} />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Endereço</label>
                <input {...register('endereco')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Cidade</label>
                <input {...register('cidade')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>UF</label>
                <input {...register('uf')} className={inputClass} maxLength={2} placeholder="SP" />
                {errors.uf && <p className="mt-1 text-xs text-red-600">{errors.uf.message}</p>}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-bg p-4">
            <p className="mb-3 text-sm font-semibold text-text">Dados da venda</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Data da venda</label>
                <input type="date" {...register('data_venda')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Valor da venda (R$)</label>
                <input type="number" step="0.01" {...register('valor_venda')} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Observações</label>
                <textarea
                  {...register('observacoes')}
                  rows={3}
                  className={inputClass}
                  placeholder="Forma de pagamento, pendências, detalhes da transferência..."
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-text">
            <input type="checkbox" {...register('baixa_concluida')} className="h-4 w-4 accent-primary" />
            Baixa concluída (documentação transferida para o novo dono)
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-bg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar baixa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Baixas() {
  const [motos, setMotos] = useState<MotoVendida[]>([])
  const [loading, setLoading] = useState(true)
  const [selecionada, setSelecionada] = useState<MotoVendida | null>(null)

  const fetchVendidas = useCallback(async () => {
    const { data, error } = await supabase
      .from('motos')
      .select('*, fotos:moto_fotos(id, moto_id, storage_path, ordem), baixa:moto_baixas(*)')
      .eq('status', 'vendido')
      .order('updated_at', { ascending: false })

    if (!error && data) {
      setMotos(
        (data as (Moto & { baixa: MotoBaixa | MotoBaixa[] | null })[]).map((m) => ({
          ...m,
          fotos: (m.fotos ?? []).sort((a, b) => a.ordem - b.ordem),
          baixa: Array.isArray(m.baixa) ? (m.baixa[0] ?? null) : m.baixa,
        }))
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchVendidas()
  }, [fetchVendidas])

  if (loading) return <Spinner />

  const pendentes = motos.filter((m) => !m.baixa?.baixa_concluida).length

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Baixas de veículos</h1>
          <p className="text-sm text-muted">
            Motos vendidas · {pendentes} baixa{pendentes !== 1 && 's'} pendente
            {pendentes !== 1 && 's'}
          </p>
        </div>
      </div>

      {motos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface py-16 text-center text-muted">
          <ClipboardList className="h-10 w-10" />
          <p>Nenhuma moto vendida ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {motos.map((moto) => {
            const concluida = !!moto.baixa?.baixa_concluida
            return (
              <div
                key={moto.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4"
              >
                {moto.fotos?.[0] ? (
                  <img
                    src={getThumbnailUrl(moto.fotos[0].storage_path, 100)}
                    alt=""
                    className="h-14 w-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-bg">
                    <Bike className="h-6 w-6 text-border" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-text">
                    {moto.marca} {moto.modelo} {moto.ano_fab}/{moto.ano_mod}
                  </p>
                  <p className="text-xs text-muted">
                    {moto.placa && `Placa ${moto.placa} · `}
                    {formatPreco(moto.preco)}
                  </p>
                  {moto.baixa && (
                    <p className="mt-0.5 truncate text-xs text-muted">
                      Novo dono: <span className="font-medium">{moto.baixa.nome_comprador}</span>
                      {moto.baixa.data_venda && ` · venda em ${formatData(moto.baixa.data_venda)}`}
                    </p>
                  )}
                </div>

                {concluida ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Baixa concluída
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                    <Clock className="h-3.5 w-3.5" /> {moto.baixa ? 'Em andamento' : 'Pendente'}
                  </span>
                )}

                <div className="flex gap-2">
                  <Link
                    to={`/admin/estoque/${moto.id}/documentos`}
                    title="Documentos da moto"
                    className="rounded-lg border border-border p-2 text-muted hover:bg-bg hover:text-primary"
                  >
                    <FileText className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setSelecionada(moto)}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                  >
                    {moto.baixa ? 'Editar baixa' : 'Registrar baixa'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selecionada && (
        <BaixaModal
          moto={selecionada}
          onClose={() => setSelecionada(null)}
          onSaved={fetchVendidas}
        />
      )}
    </div>
  )
}
