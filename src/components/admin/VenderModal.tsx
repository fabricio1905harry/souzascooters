import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText, Info, Paperclip, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useLoja } from '../../hooks/useLoja'
import { useUpload } from '../../hooks/useUpload'
import { DOC_TIPOS, formatPreco } from '../../lib/helpers'
import type { DocTipo, Moto } from '../../types'

const vendaSchema = z.object({
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
})

type VendaInput = z.input<typeof vendaSchema>
type VendaValues = z.output<typeof vendaSchema>

interface DocPendente {
  file: File
  tipo: DocTipo
}

interface Props {
  moto: Moto
  onClose: () => void
  onSold: () => void
}

/** Popup de venda: dados do novo proprietário + documentos para o despachante. */
export default function VenderModal({ moto, onClose, onSold }: Props) {
  const { user } = useAuth()
  const { loja } = useLoja()
  const { uploadDocumento } = useUpload()
  const [docs, setDocs] = useState<DocPendente[]>([])
  const [tipoDoc, setTipoDoc] = useState<DocTipo>('cnh')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VendaInput, unknown, VendaValues>({
    resolver: zodResolver(vendaSchema),
    defaultValues: {
      data_venda: new Date().toISOString().slice(0, 10),
      valor_venda: moto.preco,
    },
  })

  function adicionarDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) setDocs((prev) => [...prev, { file, tipo: tipoDoc }])
  }

  async function onSubmit(values: VendaValues) {
    if (!loja) {
      toast.error('Loja não carregada')
      return
    }

    try {
      // 1. Marcar a moto como vendida
      const { data: upd, error: updErr } = await supabase
        .from('motos')
        .update({ status: 'vendido' })
        .eq('id', moto.id)
        .select('id')
      if (updErr) throw updErr
      if (!upd || upd.length === 0) throw new Error('Sem permissão para alterar a moto (RLS)')

      // 2. Registrar a baixa na etapa "nova" (aguardando o despachante)
      const { data: bx, error: bxErr } = await supabase
        .from('moto_baixas')
        .upsert(
          {
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
            etapa: 'nova',
            baixa_concluida: false,
            created_by: user?.id ?? null,
          },
          { onConflict: 'moto_id' }
        )
        .select('id')
      if (bxErr) throw bxErr
      if (!bx || bx.length === 0) throw new Error('Sem permissão para registrar a baixa (RLS)')

      // 3. Enviar documentos do comprador (CNH, comprovante etc.)
      for (const doc of docs) {
        await uploadDocumento(doc.file, doc.tipo, loja.id, moto.id)
      }

      toast.success('Venda registrada! Baixa enviada para o despachante.')
      onSold()
      onClose()
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Erro ao registrar a venda'
      toast.error(msg)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none'
  const labelClass = 'mb-1 block text-sm font-medium text-text'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-surface p-6 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">Vender moto</h3>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>
        <p className="mb-5 text-sm text-muted">
          {moto.marca} {moto.modelo} {moto.ano_fab}/{moto.ano_mod}
          {moto.placa && ` · Placa ${moto.placa}`} — após salvar, a moto sai do catálogo e a
          baixa é enviada ao despachante.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Dados do novo proprietário */}
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
                <input {...register('cpf')} className={inputClass} placeholder="000.000.000-00" />
              </div>
              <div>
                <label className={labelClass}>Telefone / WhatsApp</label>
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
              </div>
            </div>
          </div>

          {/* Dados da venda */}
          <div className="rounded-lg bg-bg p-4">
            <p className="mb-3 text-sm font-semibold text-text">Dados da venda</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Data da venda</label>
                <input type="date" {...register('data_venda')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Valor do anúncio (R$)</label>
                <input
                  type="text"
                  disabled
                  readOnly
                  value={formatPreco(moto.preco)}
                  className={`${inputClass} cursor-not-allowed bg-bg text-muted`}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Valor real da venda (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('valor_venda')}
                  className={inputClass}
                />
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                  <Info className="h-3.5 w-3.5 shrink-0" /> Este é o valor efetivamente pago pelo
                  comprador — pode ser diferente do valor anunciado.
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Observações para o despachante</label>
                <textarea
                  {...register('observacoes')}
                  rows={2}
                  className={inputClass}
                  placeholder="Forma de pagamento, pendências, urgência..."
                />
              </div>
            </div>
          </div>

          {/* Documentos do comprador */}
          <div className="rounded-lg bg-bg p-4">
            <p className="mb-1 text-sm font-semibold text-text">Documentos do comprador</p>
            <p className="mb-3 text-xs text-muted">
              CNH, comprovante de endereço, contrato etc. — ficam no bucket privado, visíveis
              só para admin e despachante.
            </p>

            {docs.length > 0 && (
              <ul className="mb-3 space-y-1.5">
                {docs.map((doc, i) => (
                  <li
                    key={`${doc.file.name}-${i}`}
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted" />
                    <span className="min-w-0 flex-1 truncate text-xs text-text">
                      {doc.file.name}
                    </span>
                    <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-medium uppercase text-primary-dark">
                      {DOC_TIPOS.find((t) => t.value === doc.tipo)?.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDocs((prev) => prev.filter((_, idx) => idx !== i))}
                      className="rounded p-1 text-muted hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={tipoDoc}
                onChange={(e) => setTipoDoc(e.target.value as DocTipo)}
                className="rounded-lg border border-border px-2 py-2 text-sm"
              >
                {DOC_TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text hover:bg-surface">
                <Paperclip className="h-4 w-4" /> Anexar arquivo
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={adicionarDoc}
                  className="hidden"
                />
              </label>
            </div>
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
              {isSubmitting ? 'Registrando...' : 'Confirmar venda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
