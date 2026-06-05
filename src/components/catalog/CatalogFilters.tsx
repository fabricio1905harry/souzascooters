import { useEffect, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { CatalogFilters as Filters, MotoCategoria } from '../../types'
import { CATEGORIAS } from '../../lib/helpers'

interface Props {
  marcas: string[]
  filters: Filters
  onChange: (filters: Filters) => void
}

export default function CatalogFilters({ marcas, filters, onChange }: Props) {
  const [busca, setBusca] = useState(filters.busca ?? '')
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Busca por texto com debounce de 300ms
  useEffect(() => {
    const t = setTimeout(() => {
      if ((filters.busca ?? '') !== busca) onChange({ ...filters, busca: busca || undefined })
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca])

  const filterFields = (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-text">Marca</label>
        <select
          value={filters.marca ?? ''}
          onChange={(e) => onChange({ ...filters, marca: e.target.value || undefined })}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
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
        <label className="mb-1 block text-sm font-medium text-text">Categoria</label>
        <select
          value={filters.categoria ?? ''}
          onChange={(e) =>
            onChange({ ...filters, categoria: (e.target.value || undefined) as MotoCategoria | undefined })
          }
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
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
        <label className="mb-1 block text-sm font-medium text-text">Preço</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Mín"
            value={filters.precoMin ?? ''}
            onChange={(e) =>
              onChange({ ...filters, precoMin: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Máx"
            value={filters.precoMax ?? ''}
            onChange={(e) =>
              onChange({ ...filters, precoMax: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-text">Ordenar por</label>
        <select
          value={filters.ordenacao ?? 'recentes'}
          onChange={(e) =>
            onChange({ ...filters, ordenacao: e.target.value as Filters['ordenacao'] })
          }
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="recentes">Mais recentes</option>
          <option value="menor_preco">Menor preço</option>
          <option value="maior_preco">Maior preço</option>
          <option value="menor_km">Menor KM</option>
        </select>
      </div>

      <button
        onClick={() => {
          setBusca('')
          onChange({})
        }}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:bg-bg"
      >
        Limpar filtros
      </button>
    </div>
  )

  return (
    <>
      {/* Busca + botão de filtros (mobile) */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Buscar modelo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filtros
        </button>
      </div>

      {/* Sidebar desktop */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-4 font-semibold text-text">Filtros</h2>
          {filterFields}
        </div>
      </aside>

      {/* Drawer mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-text">Filtros</h2>
              <button onClick={() => setDrawerOpen(false)}>
                <X className="h-5 w-5 text-muted" />
              </button>
            </div>
            {filterFields}
            <button
              onClick={() => setDrawerOpen(false)}
              className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
