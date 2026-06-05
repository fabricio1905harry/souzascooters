import { useEffect, useState } from 'react'
import { ExternalLink, Star } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Avaliacao, Loja } from '../../types'

function Estrelas({ nota, className = 'h-4 w-4' }: { nota: number; className?: string }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${className} ${
            i <= Math.round(nota) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </span>
  )
}

/** Selo compacto com a nota do Google — exibido abaixo do slogan. */
export function GoogleRatingBadge({ loja }: { loja: Loja }) {
  if (!loja.google_rating) return null

  const conteudo = (
    <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 shadow-sm transition-shadow hover:shadow">
      {/* "G" colorido do Google */}
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.87c2.27-2.09 3.57-5.17 3.57-8.86z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24z" />
        <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.29a12 12 0 0 0 0 10.74l3.98-3.09z" />
        <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.43-3.43A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.63l3.98 3.09C6.22 6.88 8.87 4.77 12 4.77z" />
      </svg>
      <span className="text-sm font-bold text-text">{loja.google_rating.toFixed(1).replace('.', ',')}</span>
      <Estrelas nota={loja.google_rating} className="h-3.5 w-3.5" />
      <span className="text-xs text-muted">
        {loja.google_review_count
          ? `${loja.google_review_count.toLocaleString('pt-BR')} avaliações`
          : 'no Google'}
      </span>
      {loja.google_url && <ExternalLink className="h-3 w-3 text-muted" />}
    </span>
  )

  return loja.google_url ? (
    <a href={loja.google_url} target="_blank" rel="noreferrer">
      {conteudo}
    </a>
  ) : (
    conteudo
  )
}

/** Seção de avaliações — cards com depoimentos copiados do Google. */
export function GoogleReviewsSection({ loja }: { loja: Loja }) {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])

  useEffect(() => {
    supabase
      .from('avaliacoes')
      .select('*')
      .eq('loja_id', loja.id)
      .eq('exibir', true)
      .order('data_avaliacao', { ascending: false })
      .limit(6)
      .then(({ data }) => setAvaliacoes((data as Avaliacao[]) ?? []))
  }, [loja.id])

  if (avaliacoes.length === 0) return null

  return (
    <section className="mt-10">
      <h2 className="mb-1 text-center text-lg font-semibold text-text">
        O que dizem nossos clientes
      </h2>
      <p className="mb-4 text-center text-xs text-muted">Avaliações do nosso perfil no Google</p>

      <div className="space-y-3">
        {avaliacoes.map((av) => (
          <div key={av.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary-dark">
                  {av.autor.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold text-text">{av.autor}</p>
                  <Estrelas nota={av.nota} className="h-3 w-3" />
                </div>
              </div>
              {av.data_avaliacao && (
                <span className="text-[11px] text-muted">
                  {new Date(av.data_avaliacao + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
            {av.texto && <p className="mt-2.5 text-sm leading-relaxed text-muted">{av.texto}</p>}
          </div>
        ))}
      </div>

      {loja.google_url && (
        <a
          href={loja.google_url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block text-center text-sm font-medium text-primary hover:text-primary-dark"
        >
          Ver todas as avaliações no Google →
        </a>
      )}
    </section>
  )
}
