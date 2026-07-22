import { Link, useLocation } from 'react-router-dom'
import { Bike } from 'lucide-react'
import type { Loja } from '../../types'
import { getPhotoUrl } from '../../lib/supabase'

export default function PublicHeader({ loja }: { loja: Loja | null }) {
  const { pathname } = useLocation()

  const navLink = (to: string, label: string) => {
    const active = pathname === to
    return (
      <Link
        to={to}
        className={`relative py-1 font-display text-base font-semibold uppercase tracking-wider transition-colors ${
          active ? 'text-white' : 'text-white/60 hover:text-white'
        }`}
      >
        {label}
        {active && (
          <span className="absolute -bottom-0.5 left-0 h-0.5 w-full -skew-x-12 bg-accent" />
        )}
      </Link>
    )
  }

  return (
    <header className="sticky top-0 z-30 bg-ink/95 backdrop-blur supports-[backdrop-filter]:bg-ink/90">
      {/* Listra de velocidade — assinatura da marca */}
      <div className="h-0.5 w-full bg-gradient-to-r from-accent via-primary to-ink" />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          {loja?.logo_url ? (
            <img
              src={getPhotoUrl(loja.logo_url)}
              alt={loja.nome}
              className="h-9 w-9 rounded-full border border-white/15 object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
              <Bike className="h-5 w-5 text-white" />
            </span>
          )}
          <span className="font-display text-base font-bold uppercase text-white">
            {loja?.nome ?? 'Catálogo'}
          </span>
        </Link>
        <nav className="flex items-center gap-5">
          {navLink('/', 'Início')}
          {navLink('/catalogo', 'Catálogo')}
        </nav>
      </div>
    </header>
  )
}
