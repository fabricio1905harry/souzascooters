import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AtSign, Bike, MapPin } from 'lucide-react'
import { supabase, getPhotoUrl, getThumbnailUrl } from '../../lib/supabase'
import { useLoja } from '../../hooks/useLoja'
import { registrarClick } from '../../lib/leads'
import { formatPreco } from '../../lib/helpers'
import type { LojaLink, Moto } from '../../types'
import LucideIcon from '../../components/ui/LucideIcon'
import StatusBadge from '../../components/ui/StatusBadge'
import Spinner from '../../components/ui/Spinner'
import WhatsAppFAB from '../../components/catalog/WhatsAppFAB'
import { GoogleRatingBadge, GoogleReviewsSection } from '../../components/catalog/GoogleReviews'

function LinkButton({ link, lojaId }: { link: LojaLink; lojaId: string }) {
  function handleClick() {
    registrarClick({ loja_id: lojaId, link_id: link.id, tipo: 'link' })
    window.open(link.url, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-5 py-4 text-left font-medium text-text shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
    >
      <LucideIcon name={link.icone} className="h-5 w-5 shrink-0 text-primary" />
      <span className="flex-1 text-center">{link.titulo}</span>
      <span className="w-5" />
    </button>
  )
}

function MotoDestaqueCard({ moto, lojaId }: { moto: Moto; lojaId: string }) {
  const foto = moto.fotos?.[0]

  return (
    <Link
      to={`/moto/${moto.id}`}
      onClick={() => registrarClick({ loja_id: lojaId, moto_id: moto.id, tipo: 'moto_detalhe' })}
      className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary-light via-bg to-bg">
        {foto ? (
          <img
            src={getThumbnailUrl(foto.storage_path, 400)}
            alt={`${moto.marca} ${moto.modelo}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Bike className="h-10 w-10 text-primary/30" />
          </div>
        )}
        <div className="absolute left-2 top-2">
          <StatusBadge status={moto.status} />
        </div>
      </div>
      <div className="p-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          {moto.marca}
        </p>
        <h3 className="truncate text-sm font-bold text-text">{moto.modelo}</h3>
        <p className="text-xs text-muted">
          {moto.ano_fab}/{moto.ano_mod}
          {moto.quilometragem != null && ` · ${moto.quilometragem.toLocaleString('pt-BR')} km`}
        </p>
        <p className="mt-1.5 text-base font-extrabold text-primary-dark">
          {formatPreco(moto.preco)}
        </p>
        <p className="text-[10px] text-muted">até 48x no financiamento</p>
      </div>
    </Link>
  )
}

export default function LinkPage() {
  const { loja, loading: lojaLoading } = useLoja()
  const [links, setLinks] = useState<LojaLink[]>([])
  const [destaques, setDestaques] = useState<Moto[]>([])

  useEffect(() => {
    if (!loja) return

    supabase
      .from('loja_links')
      .select('*')
      .eq('loja_id', loja.id)
      .eq('ativo', true)
      .order('ordem')
      .then(({ data }) => setLinks((data as LojaLink[]) ?? []))

    supabase
      .from('motos_publicas')
      .select('*, fotos:moto_fotos(id, moto_id, storage_path, ordem)')
      .eq('loja_id', loja.id)
      .eq('destaque', true)
      .limit(6)
      .then(({ data }) => {
        if (data) {
          setDestaques(
            (data as Moto[]).map((m) => ({
              ...m,
              fotos: (m.fotos ?? []).sort((a, b) => a.ordem - b.ordem),
            }))
          )
        }
      })
  }, [loja])

  useEffect(() => {
    if (loja) document.title = `${loja.nome} — Links`
  }, [loja])

  if (lojaLoading) return <Spinner className="min-h-screen" />

  if (!loja) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center text-muted">
        Loja não encontrada. Verifique a configuração de VITE_LOJA_SLUG.
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-lg px-4">
        {/* Capa — mesma largura dos botões, centralizada */}
        {loja.capa_url && (
          <div className="h-36 overflow-hidden rounded-2xl pt-0 shadow-sm md:h-44 mt-4">
            <img
              src={getPhotoUrl(loja.capa_url)}
              alt=""
              className="h-full w-full rounded-2xl object-cover"
            />
          </div>
        )}

        {/* Logo + slogan */}
        <div className={`flex flex-col items-center text-center ${loja.capa_url ? '-mt-12' : 'pt-12'}`}>
          {loja.logo_url ? (
            <img
              src={getPhotoUrl(loja.logo_url)}
              alt={loja.nome}
              className="h-24 w-24 rounded-full border-4 border-surface object-cover shadow-md"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-surface bg-primary-light shadow-md">
              <Bike className="h-12 w-12 text-primary" />
            </div>
          )}
          <h1 className="mt-4 text-2xl font-bold text-text">{loja.nome}</h1>
          {loja.slogan && <p className="mt-1 text-muted">{loja.slogan}</p>}
          {(loja.cidade || loja.uf) && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted">
              <MapPin className="h-4 w-4" />
              {[loja.cidade, loja.uf].filter(Boolean).join(' - ')}
            </p>
          )}
          {loja.instagram && (
            <a
              href={`https://instagram.com/${loja.instagram.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark"
            >
              <AtSign className="h-4 w-4" /> {loja.instagram.replace('@', '')}
            </a>
          )}
          <GoogleRatingBadge loja={loja} />
        </div>

        {/* Links */}
        <div className="mt-8 space-y-3">
          <Link
            to="/catalogo"
            onClick={() => registrarClick({ loja_id: loja.id, tipo: 'catalogo' })}
            className="flex w-full items-center gap-3 rounded-xl bg-primary px-5 py-4 font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-md"
          >
            <Bike className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-center">Ver catálogo de motos</span>
            <span className="w-5" />
          </Link>
          {links.map((link) => (
            <LinkButton key={link.id} link={link} lojaId={loja.id} />
          ))}
        </div>

        {/* Motos em destaque */}
        {destaques.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-center text-lg font-semibold text-text">Motos em destaque</h2>
            <div className="grid grid-cols-2 gap-3">
              {destaques.map((moto) => (
                <MotoDestaqueCard key={moto.id} moto={moto} lojaId={loja.id} />
              ))}
            </div>
          </section>
        )}

        {/* Avaliações do Google */}
        <GoogleReviewsSection loja={loja} />
      </div>

      {loja.whatsapp && <WhatsAppFAB whatsapp={loja.whatsapp} lojaId={loja.id} />}
    </div>
  )
}
