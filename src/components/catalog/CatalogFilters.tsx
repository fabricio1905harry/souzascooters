import { useEffect, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { CatalogFilters as Filters, MotoCategoria } from '../../types'
import { CATEGORIAS } from '../../lib/helpers'

interface Props {
  marcas: string[]
  filters: Filters
  onChange: (filters: Filters) => void
}

/** Campos de filtro compartilhados entre a sidebar (desktop) e o drawer (mobile). */
function FilterFields({ marcas, filters, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
          Marca
        </label>
        <select
          value={filters.marca ?? ''}
          onChange={(e) => onChange({ ...filters, marca: e.target.value || undefined })}
          className="field"
        >
          <option value="">Todas</option>
          {marcas.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
          Categoria
        </label>
        <select
          value={filters.categoria ?? ''}
          onChange={(e) =>
            onChange({ ...filters, categoria: (e.target.value || undefined) as MotoCategoria | undefined })
          }
          className="field"
        >
          <option value="">Todas</option>
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
          Preço
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Mín"
            value={filters.precoMin ?? ''}
            onChange={(e) =>
              onChange({ ...filters, precoMin: e.target.value ? Number(e.target.value) : undefined })
            }
            className="field"
          />
          <input
            type="number"
            placeholder="Máx"
            value={filters.precoMax ?? ''}
            onChange={(e) =>
              onChange({ ...filters, precoMax: e.target.value ? Number(e.target.value) : undefined })
            }
            className="field"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
          Ordenar por
        </label>
        <select
          value={filters.ordenacao ?? 'recentes'}
          onChange={(e) =>
            onChange({ ...filters, ordenacao: e.target.value as Filters['ordenacao'] })
          }
          className="field"
        >
          <option value="recentes">Mais recentes</option>
          <option value="menor_preco">Menor preço</option>
          <option value="maior_preco">Maior preço</option>
          <option value="menor_km">Menor KM</option>
        </select>
      </div>

      <button
        onClick={() => onChange({})}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-ink/30 hover:bg-bg hover:text-text"
      >
        Limpar filtros
      </button>
    </div>
  )
}

/** Sidebar fixa de filtros — visível apenas em desktop (lg+), 260px. */
export function CatalogSidebar(props: Props) {
  return (
    <aside className="sticky top-20 hidden w-[260px] shrink-0 lg:block">
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold uppercase tracking-wider text-text">
            Filtros
          </h2>
        </div>
        <FilterFields {...props} />
      </div>
    </aside>
  )
}

/** Barra de busca (full-width) + botão "Filtros" que abre o drawer no mobile. */
export function CatalogToolbar(props: Props) {
  const { filters, onChange } = props
  const [busca, setBusca] = useState(filters.busca ?? '')
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Sincroniza o input quando os filtros são limpos externamente (ex: "Limpar filtros")
  useEffect(() => {
    setBusca(filters.busca ?? '')
  }, [filters.busca])

  // Busca por texto com debounce de 300ms
  useEffect(() => {
    const t = setTimeout(() => {
      if ((filters.busca ?? '') !== busca) onChange({ ...filters, busca: busca || undefined })
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca])

  return (
    <>
      <div className="mb-4 flex w-full gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Buscar modelo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="field py-2.5 pl-9"
          />
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-text transition-colors hover:border-primary lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4 text-primary" /> Filtros
        </button>
      </div>

      {/* Drawer mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] animate-fade-up overflow-y-auto rounded-t-3xl bg-surface p-5 pb-8">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-text">
                Filtros
              </h2>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Fechar filtros"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-bg text-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterFields {...props} />
            <button
              onClick={() => setDrawerOpen(false)}
              className="mt-4 w-full rounded-xl bg-primary px-4 py-3 font-display text-base font-semibold uppercase tracking-wider text-white transition-colors hover:bg-primary-dark"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
