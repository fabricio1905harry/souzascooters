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
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg sm:rounded-2xl"
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
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 sm:gap-2">
            <Bike className="h-10 w-10 text-primary/30 sm:h-14 sm:w-14" />
            <span className="text-[10px] font-medium text-primary/40 sm:text-xs">
              Fotos em breve
            </span>
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-col items-start gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
          <StatusBadge status={moto.status} />
          {categoria && (
            <span className="hidden rounded-full bg-black/55 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm sm:inline-flex">
              {categoria}
            </span>
          )}
        </div>

        {moto.destaque && (
          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 shadow sm:right-3 sm:top-3 sm:h-7 sm:w-7">
            <Star className="h-3.5 w-3.5 fill-white text-white sm:h-4 sm:w-4" />
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted sm:text-[11px]">
          {moto.marca}
        </p>
        <h3 className="truncate text-sm font-bold leading-tight text-text sm:text-lg">
          {moto.modelo}
        </h3>

        {/* Specs com ícones */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted sm:mt-3 sm:gap-x-4 sm:gap-y-1.5 sm:text-xs">
          <span className="flex items-center gap-1 sm:gap-1.5">
            <Calendar className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" />
            {moto.ano_fab}/{moto.ano_mod}
          </span>
          <span className="flex items-center gap-1 sm:gap-1.5">
            <Gauge className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" />
            {formatKm(moto.quilometragem)}
          </span>
          <span className="flex items-center gap-1 sm:gap-1.5">
            {eletrica ? (
              <>
                <Zap className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" /> Elétrica
              </>
            ) : (
              <>
                <Fuel className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" />
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
        <div className="mt-auto border-t border-border pt-2 sm:pt-3">
          <p className="mt-2 text-base font-extrabold text-primary-dark sm:mt-0 sm:text-xl">
            {formatPreco(moto.preco)}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted sm:text-[11px]">
            <CreditCard className="h-3 w-3 shrink-0" />
            <span className="truncate">Cartão 21x · Financia 48x</span>
          </p>
        </div>

        <span className="mt-2.5 rounded-lg bg-primary px-3 py-2 text-center text-xs font-semibold text-white transition-colors group-hover:bg-primary-dark sm:mt-3 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm">
          Ver detalhes
        </span>
      </div>
    </Link>
  )
}
