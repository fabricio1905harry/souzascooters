import { Link } from 'react-router-dom'
import { Bike, Calendar, CreditCard, Gauge, Star, Zap, Fuel } from 'lucide-react'
import type { Moto } from '../../types'
import { CATEGORIAS, formatKm, formatPreco } from '../../lib/helpers'
import { getThumbnailUrl } from '../../lib/supabase'
import StatusBadge from '../ui/StatusBadge'

export default function MotoCard({ moto }: { moto: Moto }) {
  const fotoPrincipal = moto.fotos?.[0]
  const categoria = CATEGORIAS.find((c) => c.value === moto.categoria)?.label
  const eletrica = moto.combustivel === 'eletrica'

  return (
    <Link
      to={`/moto/${moto.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
    >
      {/* Foto */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary-light via-bg to-bg">
        {fotoPrincipal ? (
          <img
            src={getThumbnailUrl(fotoPrincipal.storage_path, 400)}
            alt={`${moto.marca} ${moto.modelo}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <Bike className="h-12 w-12 text-primary/30" />
            <span className="text-xs font-medium text-primary/40">Fotos em breve</span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          <StatusBadge status={moto.status} />
          {categoria && (
            <span className="rounded-full bg-black/55 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              {categoria}
            </span>
          )}
        </div>

        {moto.destaque && (
          <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 shadow">
            <Star className="h-4 w-4 fill-white text-white" />
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
          {moto.marca}
        </p>
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-text sm:text-lg">
          {moto.modelo}
        </h3>

        {/* Specs com ícones */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            {moto.ano_fab}/{moto.ano_mod}
          </span>
          <span className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-primary" />
            {formatKm(moto.quilometragem)}
          </span>
          <span className="flex items-center gap-1.5">
            {eletrica ? (
              <>
                <Zap className="h-3.5 w-3.5 text-primary" /> Elétrica
              </>
            ) : (
              <>
                <Fuel className="h-3.5 w-3.5 text-primary" />
                {moto.cilindrada
                  ? `${moto.cilindrada}cc`
                  : moto.combustivel === 'flex'
                    ? 'Flex'
                    : 'Gasolina'}
              </>
            )}
          </span>
        </div>

        {/* Preço + financiamento */}
        <div className="mt-auto border-t border-border pt-3">
          <p className="mt-2 text-xl font-extrabold text-primary-dark">
            {formatPreco(moto.preco)}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
            <CreditCard className="h-3 w-3 shrink-0" /> Cartão até 21x · Financia em até 48x
          </p>
        </div>

        <span className="mt-3 rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors group-hover:bg-primary-dark">
          Ver detalhes
        </span>
      </div>
    </Link>
  )
}
