import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Bike,
  Calendar,
  Cog,
  CreditCard,
  Fuel,
  Gauge,
  MessageCircle,
  Palette,
  Search,
  Share2,
  Tag,
  Zap,
} from 'lucide-react'
import { useLoja } from '../../hooks/useLoja'
import { useMotoPublica } from '../../hooks/useMotos'
import { getPhotoUrl, getThumbnailUrl } from '../../lib/supabase'
import {
  buildMotoUrl,
  buildWhatsAppUrl,
  CATEGORIAS,
  COMBUSTIVEIS,
  extractMotoId,
  formatKm,
  formatPreco,
} from '../../lib/helpers'
import { registrarClick } from '../../lib/leads'
import PublicHeader from '../../components/layout/PublicHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import Spinner from '../../components/ui/Spinner'
import LeadFormModal from '../../components/catalog/LeadFormModal'
import ImageZoomModal from '../../components/catalog/ImageZoomModal'

function setMeta(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export default function MotoDetail() {
  const { slug } = useParams<{ slug: string }>()
  const id = extractMotoId(slug)
  const { loja } = useLoja()
  const { moto, loading } = useMotoPublica(id)
  const [fotoAtiva, setFotoAtiva] = useState(0)
  const [leadModal, setLeadModal] = useState<'interesse' | 'financiamento' | null>(null)
  const [zoomAberto, setZoomAberto] = useState(false)

  // SEO dinâmico
  useEffect(() => {
    if (!moto) return
    const titulo = `${moto.marca} ${moto.modelo} ${moto.ano_fab}/${moto.ano_mod}`
    document.title = `${titulo} — ${formatPreco(moto.preco)}`
    setMeta('og:title', titulo)
    setMeta('og:description', moto.descricao ?? `${titulo} por ${formatPreco(moto.preco)}`)
    setMeta('og:url', buildMotoUrl(moto))
    if (moto.fotos?.[0]) setMeta('og:image', getPhotoUrl(moto.fotos[0].storage_path))
  }, [moto])

  if (loading) return <Spinner className="min-h-screen" />

  if (!moto) {
    return (
      <div className="min-h-screen">
        <PublicHeader loja={loja} />
        <div className="py-24 text-center text-muted">Moto não encontrada.</div>
      </div>
    )
  }

  const fotos = moto.fotos ?? []

  const fichaTecnica = [
    { label: 'Marca', value: moto.marca, icon: Tag },
    { label: 'Modelo', value: moto.modelo, icon: Bike },
    { label: 'Ano', value: `${moto.ano_fab}/${moto.ano_mod}`, icon: Calendar },
    { label: 'Cor', value: moto.cor ?? '—', icon: Palette },
    { label: 'Quilometragem', value: formatKm(moto.quilometragem), icon: Gauge },
    {
      label: 'Categoria',
      value: CATEGORIAS.find((c) => c.value === moto.categoria)?.label ?? '—',
      icon: Bike,
    },
    { label: 'Cilindrada', value: moto.cilindrada ? `${moto.cilindrada} cc` : '—', icon: Cog },
    {
      label: 'Combustível',
      value: COMBUSTIVEIS.find((c) => c.value === moto.combustivel)?.label ?? moto.combustivel,
      icon: moto.combustivel === 'eletrica' ? Zap : Fuel,
    },
  ]

  function handleWhatsApp() {
    if (!loja?.whatsapp || !moto) return
    registrarClick({ loja_id: loja.id, moto_id: moto.id, tipo: 'whatsapp' })
    const texto = `Olá! Tenho interesse na ${moto.marca} ${moto.modelo} ${moto.ano_fab}/${moto.ano_mod} - ${formatPreco(moto.preco)}. Vi no catálogo: ${buildMotoUrl(moto)}`
    window.open(buildWhatsAppUrl(loja.whatsapp, texto), '_blank')
  }

  async function handleCompartilhar() {
    if (!moto) return
    const url = buildMotoUrl(moto)
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado!')
    } catch {
      toast.error('Não foi possível copiar o link')
    }
  }

  return (
    <div className="min-h-screen pb-12">
      <PublicHeader loja={loja} />

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Galeria */}
          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-bg shadow-card">
              {fotos[fotoAtiva] ? (
                <>
                  <button
                    onClick={() => setZoomAberto(true)}
                    aria-label="Ampliar foto"
                    className="h-full w-full cursor-zoom-in"
                  >
                    <img
                      src={getPhotoUrl(fotos[fotoAtiva].storage_path)}
                      alt={`${moto.marca} ${moto.modelo} — foto ${fotoAtiva + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                  <span className="pointer-events-none absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur-sm">
                    <Search className="h-4 w-4" />
                  </span>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Bike className="h-16 w-16 text-border" />
                </div>
              )}
            </div>
            {fotos.length > 1 && (
              <div className="scrollbar-thin mt-3 flex gap-2 overflow-x-auto pb-1.5">
                {fotos.map((foto, i) => (
                  <button
                    key={foto.id}
                    onClick={() => setFotoAtiva(i)}
                    className={`h-20 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      i === fotoAtiva
                        ? 'border-primary shadow-glow'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={getThumbnailUrl(foto.storage_path, 200)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
                  {moto.marca}
                </p>
                <h1 className="font-display text-4xl font-bold uppercase leading-none text-text">
                  {moto.modelo}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={moto.status} />
                <button
                  onClick={handleCompartilhar}
                  aria-label="Compartilhar link da moto"
                  title="Compartilhar"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="speed-stripe mb-2" />
              <p className="font-display text-5xl font-bold leading-none text-primary-dark">
                {formatPreco(moto.preco)}
              </p>
            </div>

            {/* Banner financiamento */}
            <div className="mt-5 flex items-center gap-3 rounded-xl border-l-4 border-accent bg-accent-light p-4">
              <CreditCard className="h-8 w-8 shrink-0 text-accent-dark" />
              <div>
                <p className="text-sm font-bold text-text">
                  Cartão em até {loja?.parcelas_cartao ?? 21}x · Financiamento em até{' '}
                  {loja?.parcelas_financiamento ?? 48}x
                </p>
                <p className="text-xs text-muted">
                  Compra · Venda · Troca · Aceitamos sua moto na negociação
                </p>
              </div>
            </div>

            {/* Ficha técnica */}
            <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {fichaTecnica.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                    <Icon className="h-4 w-4 text-primary-dark" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted">{label}</p>
                    <p className="truncate text-sm font-semibold text-text">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Descrição */}
            {moto.descricao && (
              <div className="mt-6">
                <h2 className="mb-2 font-display text-xl font-semibold uppercase tracking-wider text-text">
                  Descrição
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                  {moto.descricao}
                </p>
              </div>
            )}

            {/* CTAs */}
            <div className="mt-8 space-y-3">
              {loja?.whatsapp && (
                <button
                  onClick={handleWhatsApp}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3.5 font-display text-lg font-semibold uppercase tracking-wider text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-green-600 hover:shadow-lift"
                >
                  <MessageCircle className="h-5 w-5" /> Chamar no WhatsApp
                </button>
              )}
              <button
                onClick={() => setLeadModal('interesse')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-display text-lg font-semibold uppercase tracking-wider text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-glow"
              >
                <Bike className="h-5 w-5" /> Tenho interesse
              </button>
              <button
                onClick={() => setLeadModal('financiamento')}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary px-4 py-3 font-display text-lg font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary-light"
              >
                <CreditCard className="h-5 w-5" /> Solicitar financiamento
              </button>
            </div>
          </div>
        </div>
      </div>

      {loja && leadModal && (
        <LeadFormModal
          open
          onClose={() => setLeadModal(null)}
          lojaId={loja.id}
          motoId={moto.id}
          tipo={leadModal}
          titulo={leadModal === 'interesse' ? 'Tenho interesse' : 'Solicitar financiamento'}
        />
      )}

      {zoomAberto && (
        <ImageZoomModal
          fotos={fotos}
          initialIndex={fotoAtiva}
          alt={`${moto.marca} ${moto.modelo}`}
          onClose={() => setZoomAberto(false)}
        />
      )}
    </div>
  )
}
