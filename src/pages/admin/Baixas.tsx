import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Bike,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Lock,
  Play,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, getSignedUrl, getThumbnailUrl } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import {
  DOC_TIPOS,
  ETAPA_BADGE_CLASSES,
  ETAPA_LABELS,
  formatData,
  formatPreco,
  formatTamanho,
} from '../../lib/helpers'
import type { BaixaEtapa, Moto, MotoBaixa, MotoDocumento } from '../../types'
import Spinner from '../../components/ui/Spinner'

type MotoVendida = Moto & { baixa: MotoBaixa | null }

function EtapaBadge({ etapa }: { etapa: BaixaEtapa }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${ETAPA_BADGE_CLASSES[etapa]}`}
    >
      {etapa === 'concluida' && <CheckCircle2 className="h-3.5 w-3.5" />}
      {ETAPA_LABELS[etapa]}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Lista de documentos com download via signed URL (bucket privado)    */
/* ------------------------------------------------------------------ */
function DocumentosList({ motoId }: { motoId: string }) {
  const [docs, setDocs] = useState<MotoDocumento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('moto_documentos')
      .select('*')
      .eq('moto_id', motoId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setDocs((data as MotoDocumento[]) ?? [])
        setLoading(false)
      })
  }, [motoId])

  async function baixar(doc: MotoDocumento) {
    try {
      const url = await getSignedUrl(doc.storage_path)
      window.open(url, '_blank')
    } catch {
      toast.error('Erro ao gerar link do documento')
    }
  }

  if (loading) return <p className="text-xs text-muted">Carregando documentos...</p>
  if (docs.length === 0)
    return <p className="text-xs text-muted">Nenhum documento anexado.</p>

  return (
    <ul className="space-y-1.5">
      {docs.map((doc) => (
        <li
          key={doc.id}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"
        >
          <FileText className="h-4 w-4 shrink-0 text-muted" />
          <span className="min-w-0 flex-1 truncate text-xs text-text">{doc.nome_arquivo}</span>
          <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-medium uppercase text-primary-dark">
            {DOC_TIPOS.find((t) => t.value === doc.tipo)?.label ?? doc.tipo}
          </span>
          <span className="hidden text-[10px] text-muted sm:inline">
            {formatTamanho(doc.tamanho_bytes)}
          </span>
          <button
            onClick={() => baixar(doc)}
            title="Baixar"
            className="rounded-lg p-1.5 text-muted hover:bg-bg hover:text-primary"
          >
            <Download className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ */
/* Modal de visualização (despachante) — dados fixos + documentos      */
/* ------------------------------------------------------------------ */
function BaixaViewModal({ moto, onClose }: { moto: MotoVendida; onClose: () => void }) {
  const baixa = moto.baixa!

  const campos = [
    { label: 'Nome completo', value: baixa.nome_comprador },
    { label: 'CPF', value: baixa.cpf },
    { label: 'Telefone', value: baixa.telefone },
    { label: 'E-mail', value: baixa.email },
    { label: 'Endereço', value: baixa.endereco },
    { label: 'Cidade/UF', value: [baixa.cidade, baixa.uf].filter(Boolean).join(' - ') || null },
    { label: 'Data da venda', value: baixa.data_venda ? formatData(baixa.data_venda) : null },
    { label: 'Valor da venda', value: baixa.valor_venda ? formatPreco(baixa.valor_venda) : null },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-surface p-6 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">Dados da baixa</h3>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <p className="text-sm text-muted">
            {moto.marca} {moto.modelo} {moto.ano_fab}/{moto.ano_mod}
            {moto.placa && ` · Placa ${moto.placa}`}
            {moto.chassi && ` · Chassi ${moto.chassi}`}
          </p>
          <EtapaBadge etapa={baixa.etapa} />
        </div>

        <div className="rounded-lg bg-bg p-4">
          <p className="mb-3 text-sm font-semibold text-text">Novo proprietário</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {campos.map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] text-muted">{label}</p>
                <p className="text-sm font-medium text-text">{value || '—'}</p>
              </div>
            ))}
          </div>
          {baixa.observacoes && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="text-[11px] text-muted">Observações</p>
              <p className="whitespace-pre-line text-sm text-text">{baixa.observacoes}</p>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-lg bg-bg p-4">
          <p className="mb-3 text-sm font-semibold text-text">Documentos</p>
          <DocumentosList motoId={moto.id} />
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-bg"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Modal de edição (admin)                                             */
/* ------------------------------------------------------------------ */
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
  etapa: z.enum(['nova', 'em_andamento', 'concluida']),
})

type BaixaInput = z.input<typeof baixaSchema>
type BaixaValues = z.output<typeof baixaSchema>

function BaixaEditModal({
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
      etapa: baixa?.etapa ?? 'nova',
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
      etapa: values.etapa,
      baixa_concluida: values.etapa === 'concluida',
      concluido_em: values.etapa === 'concluida' ? new Date().toISOString() : null,
      created_by: baixa?.created_by ?? user?.id ?? null,
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
      toast.success('Baixa salva!')
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
          <h3 className="text-lg font-semibold text-text">Editar baixa</h3>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>
        <p className="mb-5 text-sm text-muted">
          {moto.marca} {moto.modelo} {moto.ano_fab}/{moto.ano_mod}
          {moto.placa && ` · Placa ${moto.placa}`}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-lg bg-bg p-4">
            <p className="mb-3 text-sm font-semibold text-text">Dados do novo proprietário</p>
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
                <input {...register('cpf')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Telefone</label>
                <input {...register('telefone')} className={inputClass} />
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
                <input {...register('uf')} className={inputClass} maxLength={2} />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-bg p-4">
            <p className="mb-3 text-sm font-semibold text-text">Venda e etapa</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Data da venda</label>
                <input type="date" {...register('data_venda')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Valor (R$)</label>
                <input type="number" step="0.01" {...register('valor_venda')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Etapa</label>
                <select {...register('etapa')} className={inputClass}>
                  <option value="nova">Nova para baixa</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="concluida">Concluída</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className={labelClass}>Observações</label>
                <textarea {...register('observacoes')} rows={2} className={inputClass} />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-bg p-4">
            <p className="mb-3 text-sm font-semibold text-text">Documentos</p>
            <DocumentosList motoId={moto.id} />
          </div>

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

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */
export default function Baixas() {
  const { user, perfil } = useAuth()
  const isAdmin = perfil?.papel === 'admin'

  const [motos, setMotos] = useState<MotoVendida[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<MotoVendida | null>(null)
  const [vendo, setVendo] = useState<MotoVendida | null>(null)

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

  async function mudarEtapa(baixa: MotoBaixa, etapa: BaixaEtapa) {
    const patch: Record<string, unknown> = { etapa }
    if (etapa === 'em_andamento') {
      patch.iniciado_por = user?.id ?? null
      patch.iniciado_em = new Date().toISOString()
    }
    if (etapa === 'concluida') {
      patch.baixa_concluida = true
      patch.concluido_em = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('moto_baixas')
      .update(patch)
      .eq('id', baixa.id)
      .select('id')

    if (error) {
      toast.error(`Erro: ${error.message}`)
    } else if (!data || data.length === 0) {
      toast.error('Sem permissão (verifique seu perfil de acesso)')
    } else {
      toast.success(
        etapa === 'em_andamento' ? 'Processo iniciado! Dados liberados.' : 'Baixa concluída! 🎉'
      )
      fetchVendidas()
    }
  }

  if (loading) return <Spinner />

  const pendentes = motos.filter((m) => m.baixa && m.baixa.etapa !== 'concluida').length
  const semBaixa = motos.filter((m) => !m.baixa).length

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold uppercase text-text">Baixas de veículos</h1>
        <p className="text-sm text-muted">
          {motos.length} vendida{motos.length !== 1 && 's'} · {pendentes + semBaixa} pendente
          {pendentes + semBaixa !== 1 && 's'} de conclusão
        </p>
      </div>

      {motos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface py-16 text-center text-muted">
          <ClipboardList className="h-10 w-10" />
          <p>Nenhuma moto vendida ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {motos.map((moto) => {
            const baixa = moto.baixa
            const etapa = baixa?.etapa ?? null
            // Despachante só vê os dados do dono após iniciar o processo
            const dadosLiberados = isAdmin || (etapa !== null && etapa !== 'nova')

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
                  {baixa &&
                    (dadosLiberados ? (
                      <p className="mt-0.5 truncate text-xs text-muted">
                        Novo dono: <span className="font-medium">{baixa.nome_comprador}</span>
                        {baixa.data_venda && ` · venda em ${formatData(baixa.data_venda)}`}
                      </p>
                    ) : (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                        <Lock className="h-3 w-3" /> Dados liberados ao iniciar o processo
                      </p>
                    ))}
                  {!baixa && (
                    <p className="mt-0.5 text-xs text-amber-600">
                      Venda sem dados do comprador — registre a baixa
                    </p>
                  )}
                </div>

                {etapa ? (
                  <EtapaBadge etapa={etapa} />
                ) : (
                  <span className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    Sem dados
                  </span>
                )}

                <div className="flex flex-wrap gap-2">
                  {/* Despachante: iniciar processo → libera os dados */}
                  {baixa && etapa === 'nova' && (
                    <button
                      onClick={() => mudarEtapa(baixa, 'em_andamento')}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                    >
                      <Play className="h-4 w-4" /> Iniciar processo
                    </button>
                  )}

                  {/* Dados liberados: ver dados + documentos */}
                  {baixa && dadosLiberados && (
                    <button
                      onClick={() => setVendo(moto)}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-bg"
                    >
                      Ver dados
                    </button>
                  )}

                  {/* Concluir (em andamento) */}
                  {baixa && etapa === 'em_andamento' && (
                    <button
                      onClick={() => mudarEtapa(baixa, 'concluida')}
                      className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Concluir
                    </button>
                  )}

                  {/* Admin: editar (ou registrar quando vendida sem baixa) */}
                  {isAdmin && (
                    <button
                      onClick={() => setEditando(moto)}
                      className="rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary-light"
                    >
                      {baixa ? 'Editar' : 'Registrar baixa'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editando && (
        <BaixaEditModal
          moto={editando}
          onClose={() => setEditando(null)}
          onSaved={fetchVendidas}
        />
      )}
      {vendo && vendo.baixa && <BaixaViewModal moto={vendo} onClose={() => setVendo(null)} />}
    </div>
  )
}
