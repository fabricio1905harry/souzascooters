import { Link } from 'react-router-dom'
import { Bike, Calendar, CreditCard, Gauge, Star, Zap, Fuel } from 'lucide-react'
import type { Loja, Moto } from '../../types'
import { buildMotoSlug, CATEGORIAS, formatKm, formatPreco } from '../../lib/helpers'
import { getThumbnailUrl } from '../../lib/supabase'
import StatusBadge from '../ui/StatusBadge'

const PARCELAS_CARTAO_PADRAO = 21
const PARCELAS_FINANCIAMENTO_PADRAO = 48

export default function MotoCard({ moto, loja }: { moto: Moto; loja?: Loja | null }) {
  const fotoPrincipal = moto.fotos?.[0]
  const categoria = CATEGORIAS.find((c) => c.value === moto.categoria)?.label
  const eletrica = moto.combustivel === 'eletrica'
  const parcelasCartao = loja?.parcelas_cartao ?? PARCELAS_CARTAO_PADRAO
  const parcelasFinanciamento = loja?.parcelas_financiamento ?? PARCELAS_FINANCIAMENTO_PADRAO

  return (
    <Link
      to={`/moto/${buildMotoSlug(moto)}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift"
    >
      {/* Foto */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary-light via-bg to-bg">
        {fotoPrincipal ? (
          <img
            src={getThumbnailUrl(fotoPrincipal.storage_path, 400)}
            alt={`${moto.marca} ${moto.modelo}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
            <span className="rounded-full bg-ink/70 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
              {categoria}
            </span>
          )}
        </div>

        {moto.destaque && (
          <span className="absolute right-0 top-3 flex items-center gap-1 bg-accent py-1 pl-2.5 pr-3 font-display text-xs font-bold uppercase tracking-wider text-ink shadow-sm [clip-path:polygon(8px_0,100%_0,100%_100%,0_100%)]">
            <Star className="h-3 w-3 fill-ink" /> Destaque
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">{moto.marca}</p>
        <h3 className="line-clamp-2 font-display text-2xl font-semibold uppercase leading-tight text-text">
          {moto.modelo}
        </h3>

        {/* Specs com ícones */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-muted">
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
          <p className="mt-1 font-display text-3xl font-bold leading-none text-primary-dark">
            {formatPreco(moto.preco)}
          </p>
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted">
            <CreditCard className="h-3 w-3 shrink-0" /> Cartão até {parcelasCartao}x · Financia em
            até {parcelasFinanciamento}x
          </p>
        </div>

        <span className="mt-3 rounded-xl bg-primary px-4 py-2.5 text-center font-display text-base font-semibold uppercase tracking-wider text-white transition-colors group-hover:bg-primary-dark">
          Ver detalhes
        </span>
      </div>
    </Link>
  )
}
