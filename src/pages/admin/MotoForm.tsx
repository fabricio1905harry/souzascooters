import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowDown, ArrowUp, ImagePlus, Info, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, getThumbnailUrl } from '../../lib/supabase'
import { useLoja } from '../../hooks/useLoja'
import { useUpload } from '../../hooks/useUpload'
import { CATEGORIAS, COMBUSTIVEIS, STATUS_LABELS } from '../../lib/helpers'
import type { Moto, MotoFoto, MotoStatus } from '../../types'
import Spinner from '../../components/ui/Spinner'

const anoAtual = new Date().getFullYear()

const motoSchema = z.object({
  marca: z.string().min(2, 'Informe a marca'),
  modelo: z.string().min(1, 'Informe o modelo'),
  ano_fab: z.coerce.number().int().min(1950).max(anoAtual + 1),
  ano_mod: z.coerce.number().int().min(1950).max(anoAtual + 2),
  cor: z.string().optional(),
  cilindrada: z.coerce.number().int().positive().optional().or(z.literal('')),
  categoria: z.string().optional(),
  combustivel: z.enum(['gasolina', 'flex', 'eletrica']),
  preco: z.coerce.number().positive('Informe o preço'),
  quilometragem: z.coerce.number().int().min(0).optional().or(z.literal('')),
  status: z.enum(['disponivel', 'reservado', 'vendido', 'manutencao']),
  placa: z.string().optional(),
  chassi: z.string().optional(),
  descricao: z.string().optional(),
  destaque: z.boolean(),
  publicado: z.boolean(),
})

type MotoFormInput = z.input<typeof motoSchema>
type MotoFormValues = z.output<typeof motoSchema>

const MARCAS = [
  'Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'BMW', 'Harley-Davidson',
  'Triumph', 'Ducati', 'Royal Enfield', 'Haojue', 'Shineray', 'Dafra',
  'Bajaj', 'KTM', 'Voltz', 'Outra',
]

interface NovaFoto {
  file: File
  preview: string
}

export default function MotoForm() {
  const { id } = useParams<{ id: string }>()
  const editando = !!id
  const navigate = useNavigate()
  const { loja } = useLoja()
  const { uploadFoto, removerFoto } = useUpload()

  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [fotosExistentes, setFotosExistentes] = useState<MotoFoto[]>([])
  const [fotosRemovidas, setFotosRemovidas] = useState<MotoFoto[]>([])
  const [novasFotos, setNovasFotos] = useState<NovaFoto[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MotoFormInput, unknown, MotoFormValues>({
    resolver: zodResolver(motoSchema),
    defaultValues: {
      combustivel: 'gasolina',
      status: 'disponivel',
      destaque: false,
      publicado: false,
    },
  })

  // Carregar moto existente
  useEffect(() => {
    if (!id) return
    supabase
      .from('motos')
      .select('*, fotos:moto_fotos(id, moto_id, storage_path, ordem)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error('Moto não encontrada')
          navigate('/admin/estoque')
          return
        }
        const moto = data as Moto
        reset({
          marca: moto.marca,
          modelo: moto.modelo,
          ano_fab: moto.ano_fab,
          ano_mod: moto.ano_mod,
          cor: moto.cor ?? '',
          cilindrada: moto.cilindrada ?? '',
          categoria: moto.categoria ?? '',
          combustivel: moto.combustivel,
          preco: moto.preco,
          quilometragem: moto.quilometragem ?? '',
          status: moto.status,
          placa: moto.placa ?? '',
          chassi: moto.chassi ?? '',
          descricao: moto.descricao ?? '',
          destaque: moto.destaque,
          publicado: moto.publicado,
        })
        setFotosExistentes((moto.fotos ?? []).sort((a, b) => a.ordem - b.ordem))
        setCarregando(false)
      })
  }, [id, navigate, reset])

  function handleSelecionarFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const novas = files.map((file) => ({ file, preview: URL.createObjectURL(file) }))
    setNovasFotos((prev) => [...prev, ...novas])
    e.target.value = ''
  }

  function moverNovaFoto(index: number, dir: -1 | 1) {
    setNovasFotos((prev) => {
      const arr = [...prev]
      const alvo = index + dir
      if (alvo < 0 || alvo >= arr.length) return arr
      ;[arr[index], arr[alvo]] = [arr[alvo], arr[index]]
      return arr
    })
  }

  function moverFotoExistente(index: number, dir: -1 | 1) {
    setFotosExistentes((prev) => {
      const arr = [...prev]
      const alvo = index + dir
      if (alvo < 0 || alvo >= arr.length) return arr
      ;[arr[index], arr[alvo]] = [arr[alvo], arr[index]]
      return arr
    })
  }

  async function onSubmit(values: MotoFormValues) {
    if (!loja) {
      toast.error('Loja não carregada')
      return
    }
    setSalvando(true)
    try {
      const payload = {
        loja_id: loja.id,
        marca: values.marca,
        modelo: values.modelo,
        ano_fab: values.ano_fab,
        ano_mod: values.ano_mod,
        cor: values.cor || null,
        cilindrada: values.cilindrada === '' ? null : values.cilindrada,
        categoria: values.categoria || null,
        combustivel: values.combustivel,
        preco: values.preco,
        quilometragem: values.quilometragem === '' ? null : values.quilometragem,
        status: values.status,
        placa: values.placa || null,
        chassi: values.chassi || null,
        descricao: values.descricao || null,
        destaque: values.destaque,
        publicado: values.publicado,
      }

      // 1. Inserir/atualizar registro em motos
      let motoId = id
      if (editando) {
        const { data, error } = await supabase
          .from('motos')
          .update(payload)
          .eq('id', id!)
          .select('id')
        if (error) throw error
        if (!data || data.length === 0)
          throw new Error('Nenhuma linha alterada — sem permissão (RLS) ou sessão expirada')
      } else {
        const { data, error } = await supabase.from('motos').insert(payload).select('id').single()
        if (error) throw error
        motoId = data.id as string
      }

      // 2. Fotos removidas: deletar do Storage + registro
      for (const foto of fotosRemovidas) {
        await removerFoto(foto.id, foto.storage_path)
      }

      // 3. Reordenar fotos existentes
      for (let i = 0; i < fotosExistentes.length; i++) {
        if (fotosExistentes[i].ordem !== i) {
          await supabase.from('moto_fotos').update({ ordem: i }).eq('id', fotosExistentes[i].id)
        }
      }

      // 4. Upload das novas fotos (continuam a numeração)
      for (let i = 0; i < novasFotos.length; i++) {
        await uploadFoto(novasFotos[i].file, loja.id, motoId!, fotosExistentes.length + i)
      }

      toast.success(editando ? 'Moto atualizada!' : 'Moto cadastrada!')
      navigate('/admin/estoque')
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Erro ao salvar a moto'
      toast.error(msg)
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <Spinner />

  const inputClass =
    'w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none'
  const labelClass = 'mb-1 block text-sm font-medium text-text'

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-text">
        {editando ? 'Editar moto' : 'Nova moto'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 1. Informações básicas */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-semibold text-text">Informações básicas</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Marca *</label>
              <select {...register('marca')} className={inputClass}>
                <option value="">Selecione...</option>
                {MARCAS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              {errors.marca && <p className="mt-1 text-xs text-red-600">{errors.marca.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Modelo *</label>
              <input {...register('modelo')} className={inputClass} placeholder="CB 500F" />
              {errors.modelo && (
                <p className="mt-1 text-xs text-red-600">{errors.modelo.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Ano fabricação *</label>
              <input type="number" {...register('ano_fab')} className={inputClass} />
              {errors.ano_fab && (
                <p className="mt-1 text-xs text-red-600">{errors.ano_fab.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Ano modelo *</label>
              <input type="number" {...register('ano_mod')} className={inputClass} />
              {errors.ano_mod && (
                <p className="mt-1 text-xs text-red-600">{errors.ano_mod.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Cor</label>
              <input {...register('cor')} className={inputClass} placeholder="Vermelha" />
            </div>
            <div>
              <label className={labelClass}>Cilindrada (cc)</label>
              <input type="number" {...register('cilindrada')} className={inputClass} placeholder="500" />
            </div>
            <div>
              <label className={labelClass}>Categoria</label>
              <select {...register('categoria')} className={inputClass}>
                <option value="">Selecione...</option>
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Combustível</label>
              <select {...register('combustivel')} className={inputClass}>
                {COMBUSTIVEIS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* 2. Venda */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-semibold text-text">Venda</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Preço (R$) *</label>
              <input type="number" step="0.01" {...register('preco')} className={inputClass} />
              {errors.preco && <p className="mt-1 text-xs text-red-600">{errors.preco.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Quilometragem</label>
              <input type="number" {...register('quilometragem')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Status inicial</label>
              <select {...register('status')} className={inputClass}>
                {(Object.keys(STATUS_LABELS) as MotoStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* 3. Documentação interna */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-1 font-semibold text-text">Documentação interna</h2>
          <p className="mb-4 flex items-center gap-1.5 text-xs text-amber-600">
            <Info className="h-4 w-4" /> Estes campos não aparecem no catálogo público.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Placa</label>
              <input {...register('placa')} className={inputClass} placeholder="ABC1D23" />
            </div>
            <div>
              <label className={labelClass}>Chassi</label>
              <input {...register('chassi')} className={inputClass} placeholder="9C2..." />
            </div>
          </div>
        </section>

        {/* 4. Descrição */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-semibold text-text">Descrição</h2>
          <textarea
            {...register('descricao')}
            rows={5}
            className={inputClass}
            placeholder="Detalhes, revisões, acessórios..."
          />
        </section>

        {/* 5. Fotos */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-1 font-semibold text-text">Fotos</h2>
          <p className="mb-4 text-xs text-muted">
            A primeira foto da lista é a foto principal do catálogo.
          </p>

          {(fotosExistentes.length > 0 || novasFotos.length > 0) && (
            <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {fotosExistentes.map((foto, i) => (
                <div key={foto.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border">
                  <img
                    src={getThumbnailUrl(foto.storage_path, 200)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {i === 0 && novasFotos.length >= 0 && (
                    <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Principal
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" onClick={() => moverFotoExistente(i, -1)} className="rounded p-1 text-white hover:bg-white/20">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => moverFotoExistente(i, 1)} className="rounded p-1 text-white hover:bg-white/20">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFotosRemovidas((prev) => [...prev, foto])
                        setFotosExistentes((prev) => prev.filter((f) => f.id !== foto.id))
                      }}
                      className="rounded p-1 text-white hover:bg-red-500/60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {novasFotos.map((foto, i) => (
                <div key={foto.preview} className="group relative aspect-[4/3] overflow-hidden rounded-lg border-2 border-dashed border-primary/50">
                  <img src={foto.preview} alt="" className="h-full w-full object-cover" />
                  {fotosExistentes.length === 0 && i === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Principal
                    </span>
                  )}
                  <span className="absolute right-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Nova
                  </span>
                  <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" onClick={() => moverNovaFoto(i, -1)} className="rounded p-1 text-white hover:bg-white/20">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => moverNovaFoto(i, 1)} className="rounded p-1 text-white hover:bg-white/20">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(foto.preview)
                        setNovasFotos((prev) => prev.filter((_, idx) => idx !== i))
                      }}
                      className="rounded p-1 text-white hover:bg-red-500/60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-muted transition-colors hover:border-primary hover:text-primary">
            <ImagePlus className="h-6 w-6" />
            <span className="text-sm font-medium">Adicionar fotos (JPG, PNG, WebP)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleSelecionarFotos}
              className="hidden"
            />
          </label>
        </section>

        {/* 6. Opções */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-semibold text-text">Opções</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" {...register('destaque')} className="h-4 w-4 accent-primary" />
              Exibir como destaque na página de links
            </label>
            <label className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" {...register('publicado')} className="h-4 w-4 accent-primary" />
              Publicar imediatamente no catálogo
            </label>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/estoque')}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text hover:bg-bg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar moto'}
          </button>
        </div>
      </form>
    </div>
  )
}
