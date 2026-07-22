import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useLoja } from '../../hooks/useLoja'
import Spinner from '../../components/ui/Spinner'
import BrandingUploader from '../../components/admin/BrandingUploader'
import LinksManager from '../../components/admin/LinksManager'
import ReviewsManager from '../../components/admin/ReviewsManager'

const settingsSchema = z.object({
  nome: z.string().min(2, 'Informe o nome da loja'),
  slogan: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  site_url: z.string().url('URL inválida').optional().or(z.literal('')),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2, 'Use a sigla (ex: SP)').optional(),
  cor_primaria: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use formato hex (#1D9E75)'),
  parcelas_cartao: z.coerce.number().int().min(1, 'Mínimo 1x'),
  parcelas_financiamento: z.coerce.number().int().min(1, 'Mínimo 1x'),
})

type SettingsForm = z.output<typeof settingsSchema>
type SettingsFormInput = z.input<typeof settingsSchema>

export default function Settings() {
  const { loja, loading } = useLoja()
  const [salvando, setSalvando] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsFormInput, unknown, SettingsForm>({
    resolver: zodResolver(settingsSchema),
  })

  useEffect(() => {
    if (loja) {
      reset({
        nome: loja.nome,
        slogan: loja.slogan ?? '',
        whatsapp: loja.whatsapp ?? '',
        instagram: loja.instagram ?? '',
        facebook: loja.facebook ?? '',
        site_url: loja.site_url ?? '',
        endereco: loja.endereco ?? '',
        cidade: loja.cidade ?? '',
        uf: loja.uf ?? '',
        cor_primaria: loja.cor_primaria,
        parcelas_cartao: loja.parcelas_cartao,
        parcelas_financiamento: loja.parcelas_financiamento,
      })
    }
  }, [loja, reset])

  async function onSubmit(values: SettingsForm) {
    if (!loja) return
    setSalvando(true)
    const { error } = await supabase
      .from('lojas')
      .update({
        nome: values.nome,
        slogan: values.slogan || null,
        whatsapp: values.whatsapp || null,
        instagram: values.instagram || null,
        facebook: values.facebook || null,
        site_url: values.site_url || null,
        endereco: values.endereco || null,
        cidade: values.cidade || null,
        uf: values.uf || null,
        cor_primaria: values.cor_primaria,
        parcelas_cartao: values.parcelas_cartao,
        parcelas_financiamento: values.parcelas_financiamento,
      })
      .eq('id', loja.id)
    setSalvando(false)

    if (error) toast.error('Erro ao salvar configurações')
    else toast.success('Configurações salvas!')
  }

  if (loading) return <Spinner />

  const inputClass =
    'w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none'
  const labelClass = 'mb-1 block text-sm font-medium text-text'

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-bold uppercase text-text">Configurações da loja</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-semibold text-text">Identidade</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Nome da loja *</label>
              <input {...register('nome')} className={inputClass} />
              {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Slogan</label>
              <input {...register('slogan')} className={inputClass} placeholder="As melhores motos de SP" />
            </div>
            <div>
              <label className={labelClass}>Cor primária</label>
              <div className="flex gap-2">
                <input {...register('cor_primaria')} className={inputClass} placeholder="#1D9E75" />
              </div>
              {errors.cor_primaria && (
                <p className="mt-1 text-xs text-red-600">{errors.cor_primaria.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Máx. parcelas no cartão</label>
              <input
                type="number"
                min={1}
                {...register('parcelas_cartao')}
                className={inputClass}
                placeholder="21"
              />
              {errors.parcelas_cartao && (
                <p className="mt-1 text-xs text-red-600">{errors.parcelas_cartao.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Máx. parcelas no financiamento</label>
              <input
                type="number"
                min={1}
                {...register('parcelas_financiamento')}
                className={inputClass}
                placeholder="48"
              />
              {errors.parcelas_financiamento && (
                <p className="mt-1 text-xs text-red-600">{errors.parcelas_financiamento.message}</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-semibold text-text">Contato e redes</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>WhatsApp (com DDI)</label>
              <input {...register('whatsapp')} className={inputClass} placeholder="5511999999999" />
            </div>
            <div>
              <label className={labelClass}>Instagram</label>
              <input {...register('instagram')} className={inputClass} placeholder="@motoexpress" />
            </div>
            <div>
              <label className={labelClass}>Facebook</label>
              <input {...register('facebook')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Site</label>
              <input {...register('site_url')} className={inputClass} placeholder="https://..." />
              {errors.site_url && (
                <p className="mt-1 text-xs text-red-600">{errors.site_url.message}</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-semibold text-text">Endereço</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label className={labelClass}>Endereço</label>
              <input {...register('endereco')} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Cidade</label>
              <input {...register('cidade')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>UF</label>
              <input {...register('uf')} className={inputClass} maxLength={2} placeholder="SP" />
              {errors.uf && <p className="mt-1 text-xs text-red-600">{errors.uf.message}</p>}
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={salvando}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </form>

      {/* Seções com persistência própria no Supabase */}
      {loja && (
        <div className="mt-6 space-y-6">
          <BrandingUploader loja={loja} />
          <LinksManager lojaId={loja.id} />
          <ReviewsManager loja={loja} />
        </div>
      )}
    </div>
  )
}
