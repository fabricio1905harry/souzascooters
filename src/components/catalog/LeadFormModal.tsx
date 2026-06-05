import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { notificarLead } from '../../lib/leads'
import type { Lead } from '../../types'

const leadSchema = z.object({
  nome: z.string().min(2, 'Informe seu nome'),
  telefone: z.string().min(10, 'Informe um telefone válido'),
  mensagem: z.string().optional(),
})

type LeadForm = z.infer<typeof leadSchema>

interface Props {
  open: boolean
  onClose: () => void
  lojaId: string
  motoId: string
  tipo: Lead['tipo']
  titulo: string
}

export default function LeadFormModal({ open, onClose, lojaId, motoId, tipo, titulo }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadForm>({ resolver: zodResolver(leadSchema) })

  if (!open) return null

  async function onSubmit(values: LeadForm) {
    try {
      await notificarLead({
        loja_id: lojaId,
        moto_id: motoId,
        tipo,
        nome: values.nome,
        telefone: values.telefone,
        mensagem: values.mensagem || null,
      })
      toast.success('Recebemos seu contato! Em breve retornaremos.')
      reset()
      onClose()
    } catch {
      toast.error('Erro ao enviar. Tente novamente.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">{titulo}</h3>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Nome</label>
            <input
              {...register('nome')}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="Seu nome"
            />
            {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Telefone / WhatsApp</label>
            <input
              {...register('telefone')}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="(11) 99999-9999"
            />
            {errors.telefone && (
              <p className="mt-1 text-xs text-red-600">{errors.telefone.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Mensagem (opcional)</label>
            <textarea
              {...register('mensagem')}
              rows={3}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="Conte mais sobre seu interesse..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  )
}
