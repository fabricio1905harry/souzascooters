import { useEffect, useState } from 'react'
import { SearchX } from 'lucide-react'
import { useLoja } from '../../hooks/useLoja'
import { useMarcas, useMotosPublicas } from '../../hooks/useMotos'
import type { CatalogFilters as Filters } from '../../types'
import PublicHeader from '../../components/layout/PublicHeader'
import { CatalogSidebar, CatalogToolbar } from '../../components/catalog/CatalogFilters'
import MotoCard from '../../components/catalog/MotoCard'
import Spinner from '../../components/ui/Spinner'
import WhatsAppFAB from '../../components/catalog/WhatsAppFAB'

const PAGE_SIZE = 12

export default function Catalog() {
  const { loja } = useLoja()
  const [filters, setFilters] = useState<Filters>({})
  const [page, setPage] = useState(1)
  const marcas = useMarcas(loja?.id)
  const { motos, loading } = useMotosPublicas(loja?.id, filters)

  useEffect(() => {
    document.title = loja ? `Catálogo — ${loja.nome}` : 'Catálogo'
  }, [loja])

  useEffect(() => setPage(1), [filters])

  const visiveis = motos.slice(0, page * PAGE_SIZE)
  const temMais = motos.length > visiveis.length

  return (
    <div className="min-h-screen pb-24">
      <PublicHeader loja={loja} />

      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6">
        <h1 className="mb-4 text-xl font-bold text-text sm:text-2xl">Catálogo de motos</h1>

        {/* Desktop: sidebar 260px à esquerda + conteúdo flex-1 */}
        <div className="lg:flex lg:items-start lg:gap-6">
          <CatalogSidebar marcas={marcas} filters={filters} onChange={setFilters} />

          <div className="min-w-0 flex-1">
            {/* Busca full-width + botão Filtros (mobile) */}
            <CatalogToolbar marcas={marcas} filters={filters} onChange={setFilters} />

            {loading ? (
              <Spinner />
            ) : visiveis.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center text-muted">
                <SearchX className="h-10 w-10" />
                <p>Nenhuma moto encontrada com esses filtros.</p>
              </div>
            ) : (
              <>
                <p className="mb-3 text-sm text-muted">
                  {motos.length} moto{motos.length !== 1 && 's'} encontrada
                  {motos.length !== 1 && 's'}
                </p>
                {/* 1 col mobile · 2 cols tablet · 3 cols desktop · 4 cols desktop largo */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {visiveis.map((moto) => (
                    <MotoCard key={moto.id} moto={moto} />
                  ))}
                </div>
                {temMais && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-lg border border-border bg-surface px-6 py-2.5 text-sm font-medium text-text hover:bg-bg"
                    >
                      Carregar mais
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {loja?.whatsapp && <WhatsAppFAB whatsapp={loja.whatsapp} lojaId={loja.id} />}
    </div>
  )
}
