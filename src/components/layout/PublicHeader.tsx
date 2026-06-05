import { Link } from 'react-router-dom'
import { Bike } from 'lucide-react'
import type { Loja } from '../../types'
import { getPhotoUrl } from '../../lib/supabase'

export default function PublicHeader({ loja }: { loja: Loja | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          {loja?.logo_url ? (
            <img
              src={getPhotoUrl(loja.logo_url)}
              alt={loja.nome}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <Bike className="h-7 w-7 text-primary" />
          )}
          <span className="font-semibold text-text">{loja?.nome ?? 'Catálogo'}</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link to="/" className="text-muted hover:text-text">
            Início
          </Link>
          <Link to="/catalogo" className="text-primary hover:text-primary-dark">
            Catálogo
          </Link>
        </nav>
      </div>
    </header>
  )
}
