import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import type { LojaLink } from '../../types'
import LucideIcon, { ICON_OPTIONS } from '../ui/LucideIcon'
import ConfirmDialog from '../ui/ConfirmDialog'

interface Props {
  lojaId: string
}

/** CRUD dos links da link page — persistido na tabela loja_links do Supabase. */
export default function LinksManager({ lojaId }: Props) {
  const [links, setLinks] = useState<LojaLink[]>([])
  const [novo, setNovo] = useState({ titulo: '', url: '', icone: 'Link' })
  const [remover, setRemover] = useState<LojaLink | null>(null)
  const [salvandoNovo, setSalvandoNovo] = useState(false)

  const fetchLinks = useCallback(async () => {
    const { data } = await supabase
      .from('loja_links')
      .select('*')
      .eq('loja_id', lojaId)
      .order('ordem')
    setLinks((data as LojaLink[]) ?? [])
  }, [lojaId])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  function editarLocal(id: string, patch: Partial<LojaLink>) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  async function salvarLink(link: LojaLink) {
    if (!link.titulo.trim() || !link.url.trim()) {
      toast.error('Título e URL são obrigatórios')
      return
    }
    const { error } = await supabase
      .from('loja_links')
      .update({ titulo: link.titulo, url: link.url, icone: link.icone, ativo: link.ativo })
      .eq('id', link.id)
    if (error) toast.error('Erro ao salvar link')
    else toast.success('Link salvo')
  }

  async function toggleAtivo(link: LojaLink) {
    const { error } = await supabase
      .from('loja_links')
      .update({ ativo: !link.ativo })
      .eq('id', link.id)
    if (error) toast.error('Erro ao atualizar')
    else {
      editarLocal(link.id, { ativo: !link.ativo })
      toast.success(link.ativo ? 'Link desativado' : 'Link ativado')
    }
  }

  async function mover(index: number, dir: -1 | 1) {
    const alvo = index + dir
    if (alvo < 0 || alvo >= links.length) return
    const a = links[index]
    const b = links[alvo]
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from('loja_links').update({ ordem: alvo }).eq('id', a.id),
      supabase.from('loja_links').update({ ordem: index }).eq('id', b.id),
    ])
    if (e1 || e2) toast.error('Erro ao reordenar')
    else fetchLinks()
  }

  async function adicionar() {
    if (!novo.titulo.trim() || !novo.url.trim()) {
      toast.error('Preencha título e URL')
      return
    }
    setSalvandoNovo(true)
    const { error } = await supabase.from('loja_links').insert({
      loja_id: lojaId,
      titulo: novo.titulo,
      url: novo.url,
      icone: novo.icone,
      ordem: links.length,
      ativo: true,
    })
    setSalvandoNovo(false)
    if (error) {
      toast.error('Erro ao adicionar link')
    } else {
      toast.success('Link adicionado')
      setNovo({ titulo: '', url: '', icone: 'Link' })
      fetchLinks()
    }
  }

  async function handleRemover() {
    if (!remover) return
    const { error } = await supabase.from('loja_links').delete().eq('id', remover.id)
    if (error) toast.error('Erro ao remover link')
    else {
      toast.success('Link removido')
      fetchLinks()
    }
    setRemover(null)
  }

  const inputClass =
    'w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none'

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-1 font-semibold text-text">Links da link page</h2>
      <p className="mb-4 text-xs text-muted">
        Botões exibidos na página inicial, na ordem abaixo. Tudo é salvo no Supabase.
      </p>

      {links.length === 0 ? (
        <p className="mb-4 text-sm text-muted">Nenhum link cadastrado ainda.</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {links.map((link, i) => (
            <li
              key={link.id}
              className={`flex flex-wrap items-center gap-2 rounded-lg border border-border p-2 ${
                !link.ativo ? 'opacity-50' : ''
              }`}
            >
              <LucideIcon name={link.icone} className="h-4 w-4 shrink-0 text-primary" />
              <input
                value={link.titulo}
                onChange={(e) => editarLocal(link.id, { titulo: e.target.value })}
                className={`${inputClass} min-w-28 flex-1`}
                placeholder="Título"
              />
              <input
                value={link.url}
                onChange={(e) => editarLocal(link.id, { url: e.target.value })}
                className={`${inputClass} min-w-40 flex-[2]`}
                placeholder="https://..."
              />
              <select
                value={link.icone ?? 'Link'}
                onChange={(e) => editarLocal(link.id, { icone: e.target.value })}
                className="rounded-lg border border-border px-2 py-2 text-sm"
              >
                {ICON_OPTIONS.map((nome) => (
                  <option key={nome} value={nome}>
                    {nome}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => salvarLink(link)}
                  title="Salvar alterações"
                  className="rounded-lg p-2 text-muted hover:bg-bg hover:text-primary"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => mover(i, -1)}
                  title="Mover para cima"
                  className="rounded-lg p-2 text-muted hover:bg-bg"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => mover(i, 1)}
                  title="Mover para baixo"
                  className="rounded-lg p-2 text-muted hover:bg-bg"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleAtivo(link)}
                  title={link.ativo ? 'Desativar' : 'Ativar'}
                  role="switch"
                  aria-checked={link.ativo}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    link.ativo ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                      link.ativo ? 'translate-x-4' : ''
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setRemover(link)}
                  title="Remover"
                  className="rounded-lg p-2 text-muted hover:bg-bg hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Adicionar novo link */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border-2 border-dashed border-border p-3">
        <input
          value={novo.titulo}
          onChange={(e) => setNovo((n) => ({ ...n, titulo: e.target.value }))}
          className={`${inputClass} min-w-28 flex-1`}
          placeholder="Título do link"
        />
        <input
          value={novo.url}
          onChange={(e) => setNovo((n) => ({ ...n, url: e.target.value }))}
          className={`${inputClass} min-w-40 flex-[2]`}
          placeholder="https://..."
        />
        <select
          value={novo.icone}
          onChange={(e) => setNovo((n) => ({ ...n, icone: e.target.value }))}
          className="rounded-lg border border-border px-2 py-2 text-sm"
        >
          {ICON_OPTIONS.map((nome) => (
            <option key={nome} value={nome}>
              {nome}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={adicionar}
          disabled={salvandoNovo}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>

      <ConfirmDialog
        open={!!remover}
        titulo="Remover link"
        mensagem={`O link "${remover?.titulo}" será removido da link page. Continuar?`}
        onConfirm={handleRemover}
        onCancel={() => setRemover(null)}
      />
    </section>
  )
}
