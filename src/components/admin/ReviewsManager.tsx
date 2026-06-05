import { useCallback, useEffect, useState } from 'react'
import { Plus, Star, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import type { Avaliacao, Loja } from '../../types'
import { formatData } from '../../lib/helpers'
import ConfirmDialog from '../ui/ConfirmDialog'

interface Props {
  loja: Loja
}

/** Gestão das avaliações do Google exibidas no site (armazenadas no Supabase). */
export default function ReviewsManager({ loja }: Props) {
  const [resumo, setResumo] = useState({
    google_rating: loja.google_rating?.toString() ?? '',
    google_review_count: loja.google_review_count?.toString() ?? '',
    google_url: loja.google_url ?? '',
  })
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [nova, setNova] = useState({ autor: '', nota: 5, texto: '', data_avaliacao: '' })
  const [remover, setRemover] = useState<Avaliacao | null>(null)
  const [salvando, setSalvando] = useState(false)

  const fetchAvaliacoes = useCallback(async () => {
    const { data } = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('loja_id', loja.id)
      .order('data_avaliacao', { ascending: false })
    setAvaliacoes((data as Avaliacao[]) ?? [])
  }, [loja.id])

  useEffect(() => {
    fetchAvaliacoes()
  }, [fetchAvaliacoes])

  async function salvarResumo() {
    setSalvando(true)
    const { error } = await supabase
      .from('lojas')
      .update({
        google_rating: resumo.google_rating ? Number(resumo.google_rating.replace(',', '.')) : null,
        google_review_count: resumo.google_review_count ? Number(resumo.google_review_count) : null,
        google_url: resumo.google_url || null,
      })
      .eq('id', loja.id)
    setSalvando(false)
    if (error) toast.error('Erro ao salvar resumo')
    else toast.success('Resumo do Google salvo!')
  }

  async function adicionar() {
    if (!nova.autor.trim()) {
      toast.error('Informe o nome do autor')
      return
    }
    const { error } = await supabase.from('avaliacoes').insert({
      loja_id: loja.id,
      autor: nova.autor,
      nota: nova.nota,
      texto: nova.texto || null,
      data_avaliacao: nova.data_avaliacao || null,
    })
    if (error) {
      toast.error('Erro ao adicionar avaliação')
    } else {
      toast.success('Avaliação adicionada')
      setNova({ autor: '', nota: 5, texto: '', data_avaliacao: '' })
      fetchAvaliacoes()
    }
  }

  async function toggleExibir(av: Avaliacao) {
    const { error } = await supabase
      .from('avaliacoes')
      .update({ exibir: !av.exibir })
      .eq('id', av.id)
    if (error) toast.error('Erro ao atualizar')
    else fetchAvaliacoes()
  }

  async function handleRemover() {
    if (!remover) return
    const { error } = await supabase.from('avaliacoes').delete().eq('id', remover.id)
    if (error) toast.error('Erro ao remover')
    else {
      toast.success('Avaliação removida')
      fetchAvaliacoes()
    }
    setRemover(null)
  }

  const inputClass =
    'w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none'
  const labelClass = 'mb-1 block text-sm font-medium text-text'

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-1 font-semibold text-text">Avaliações do Google</h2>
      <p className="mb-4 text-xs text-muted">
        Copie as melhores avaliações do seu perfil no Google para exibir no site. O selo com a
        nota aparece no topo da link page.
      </p>

      {/* Resumo (selo) */}
      <div className="mb-5 grid gap-3 rounded-lg bg-bg p-4 sm:grid-cols-[100px_140px_1fr_auto]">
        <div>
          <label className={labelClass}>Nota</label>
          <input
            value={resumo.google_rating}
            onChange={(e) => setResumo((r) => ({ ...r, google_rating: e.target.value }))}
            className={inputClass}
            placeholder="4,9"
          />
        </div>
        <div>
          <label className={labelClass}>Nº avaliações</label>
          <input
            type="number"
            value={resumo.google_review_count}
            onChange={(e) => setResumo((r) => ({ ...r, google_review_count: e.target.value }))}
            className={inputClass}
            placeholder="120"
          />
        </div>
        <div>
          <label className={labelClass}>Link do perfil no Google</label>
          <input
            value={resumo.google_url}
            onChange={(e) => setResumo((r) => ({ ...r, google_url: e.target.value }))}
            className={inputClass}
            placeholder="https://g.page/..."
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={salvarResumo}
            disabled={salvando}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
          >
            Salvar
          </button>
        </div>
      </div>

      {/* Lista */}
      {avaliacoes.length > 0 && (
        <ul className="mb-5 space-y-2">
          {avaliacoes.map((av) => (
            <li
              key={av.id}
              className={`flex items-start gap-3 rounded-lg border border-border p-3 ${
                !av.exibir ? 'opacity-50' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-text">{av.autor}</p>
                  <span className="flex items-center gap-0.5 text-xs text-amber-500">
                    {av.nota} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </span>
                  {av.data_avaliacao && (
                    <span className="text-xs text-muted">{formatData(av.data_avaliacao)}</span>
                  )}
                </div>
                {av.texto && <p className="mt-1 line-clamp-2 text-xs text-muted">{av.texto}</p>}
              </div>
              <button
                type="button"
                onClick={() => toggleExibir(av)}
                title={av.exibir ? 'Ocultar do site' : 'Exibir no site'}
                role="switch"
                aria-checked={av.exibir}
                className={`relative mt-1 h-5 w-9 shrink-0 rounded-full transition-colors ${
                  av.exibir ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    av.exibir ? 'translate-x-4' : ''
                  }`}
                />
              </button>
              <button
                type="button"
                onClick={() => setRemover(av)}
                title="Remover"
                className="mt-0.5 rounded-lg p-1.5 text-muted hover:bg-bg hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Adicionar */}
      <div className="rounded-lg border-2 border-dashed border-border p-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_90px_150px]">
          <input
            value={nova.autor}
            onChange={(e) => setNova((n) => ({ ...n, autor: e.target.value }))}
            className={inputClass}
            placeholder="Nome do cliente (ex: Carlos M.)"
          />
          <select
            value={nova.nota}
            onChange={(e) => setNova((n) => ({ ...n, nota: Number(e.target.value) }))}
            className="rounded-lg border border-border px-2 py-2 text-sm"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} ★
              </option>
            ))}
          </select>
          <input
            type="date"
            value={nova.data_avaliacao}
            onChange={(e) => setNova((n) => ({ ...n, data_avaliacao: e.target.value }))}
            className={inputClass}
          />
        </div>
        <textarea
          value={nova.texto}
          onChange={(e) => setNova((n) => ({ ...n, texto: e.target.value }))}
          rows={2}
          className={`${inputClass} mt-3`}
          placeholder="Texto da avaliação (cole do Google)"
        />
        <button
          type="button"
          onClick={adicionar}
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" /> Adicionar avaliação
        </button>
      </div>

      <ConfirmDialog
        open={!!remover}
        titulo="Remover avaliação"
        mensagem={`A avaliação de "${remover?.autor}" será excluída. Continuar?`}
        onConfirm={handleRemover}
        onCancel={() => setRemover(null)}
      />
    </section>
  )
}
