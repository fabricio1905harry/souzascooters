import { useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, getPhotoUrl } from '../../lib/supabase'
import type { Loja } from '../../types'

interface Props {
  loja: Loja
}

type Campo = 'logo_url' | 'capa_url'

/** Upload de logo e capa da loja — arquivos no bucket motos-fotos, paths na tabela lojas. */
export default function BrandingUploader({ loja }: Props) {
  const [paths, setPaths] = useState<Record<Campo, string | null>>({
    logo_url: loja.logo_url,
    capa_url: loja.capa_url,
  })
  const [enviando, setEnviando] = useState<Campo | null>(null)

  async function handleUpload(campo: Campo, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setEnviando(campo)
    try {
      const ext = file.name.split('.').pop()
      const tipo = campo === 'logo_url' ? 'logo' : 'capa'
      const path = `${loja.id}/branding/${tipo}-${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from('motos-fotos')
        .upload(path, file, { contentType: file.type })
      if (upErr) throw upErr

      const { error: dbErr } = await supabase
        .from('lojas')
        .update({ [campo]: path })
        .eq('id', loja.id)
      if (dbErr) throw dbErr

      // Remove o arquivo antigo do Storage (se houver)
      const antigo = paths[campo]
      if (antigo) await supabase.storage.from('motos-fotos').remove([antigo])

      setPaths((p) => ({ ...p, [campo]: path }))
      toast.success(campo === 'logo_url' ? 'Logo atualizada!' : 'Capa atualizada!')
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Erro no upload da imagem'
      toast.error(`Erro no upload: ${msg}`)
    } finally {
      setEnviando(null)
    }
  }

  async function handleRemover(campo: Campo) {
    const atual = paths[campo]
    if (!atual) return
    const { error } = await supabase.from('lojas').update({ [campo]: null }).eq('id', loja.id)
    if (error) {
      toast.error('Erro ao remover imagem')
      return
    }
    await supabase.storage.from('motos-fotos').remove([atual])
    setPaths((p) => ({ ...p, [campo]: null }))
    toast.success('Imagem removida')
  }

  function renderCampo(campo: Campo, label: string, hint: string, previewClass: string) {
    const path = paths[campo]
    return (
      <div>
        <p className="mb-1 text-sm font-medium text-text">{label}</p>
        <p className="mb-2 text-xs text-muted">{hint}</p>
        <div className="flex items-center gap-3">
          {path ? (
            <img src={getPhotoUrl(path)} alt={label} className={previewClass} />
          ) : (
            <div
              className={`${previewClass} flex items-center justify-center border-2 border-dashed border-border bg-bg`}
            >
              <ImagePlus className="h-5 w-5 text-muted" />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label
              className={`cursor-pointer rounded-lg border border-border px-3 py-1.5 text-center text-xs font-medium text-text hover:bg-bg ${
                enviando === campo ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              {enviando === campo ? 'Enviando...' : path ? 'Trocar' : 'Enviar imagem'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleUpload(campo, e)}
                className="hidden"
              />
            </label>
            {path && (
              <button
                type="button"
                onClick={() => handleRemover(campo)}
                className="flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remover
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-4 font-semibold text-text">Logo e capa</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {renderCampo('logo_url', 'Logo', 'Quadrada, exibida no topo da link page', 'h-20 w-20 rounded-full object-cover')}
        {renderCampo('capa_url', 'Capa', 'Banner exibido atrás da logo (opcional)', 'h-20 w-36 rounded-lg object-cover')}
      </div>
    </section>
  )
}
