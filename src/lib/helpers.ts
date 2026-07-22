import type { BaixaEtapa, Moto, MotoStatus } from '../types'

export function formatPreco(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function formatKm(km: number | null): string {
  if (km === null || km === undefined) return '—'
  return `${km.toLocaleString('pt-BR')} km`
}

export function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function formatTamanho(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const STATUS_LABELS: Record<MotoStatus, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  vendido: 'Vendido',
  manutencao: 'Manutenção',
}

export const STATUS_BADGE_CLASSES: Record<MotoStatus, string> = {
  disponivel: 'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-600/20',
  reservado: 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-600/20',
  vendido: 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20',
  manutencao: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20',
}

export const CATEGORIAS = [
  { value: 'street', label: 'Street' },
  { value: 'trail', label: 'Trail' },
  { value: 'custom', label: 'Custom' },
  { value: 'scooter', label: 'Scooter' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'naked', label: 'Naked' },
] as const

export const COMBUSTIVEIS = [
  { value: 'gasolina', label: 'Gasolina' },
  { value: 'flex', label: 'Flex' },
  { value: 'eletrica', label: 'Elétrica' },
] as const

export const DOC_TIPOS = [
  { value: 'atpv', label: 'ATPV' },
  { value: 'crlv', label: 'CRLV' },
  { value: 'laudo', label: 'Laudo' },
  { value: 'nf', label: 'NF' },
  { value: 'cnh', label: 'CNH' },
  { value: 'endereco', label: 'Comp. endereço' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'outro', label: 'Outro' },
] as const

export const ETAPA_LABELS: Record<BaixaEtapa, string> = {
  nova: 'Nova para baixa',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
}

export const ETAPA_BADGE_CLASSES: Record<BaixaEtapa, string> = {
  nova: 'bg-blue-100 text-blue-800',
  em_andamento: 'bg-amber-100 text-amber-800',
  concluida: 'bg-green-100 text-green-800',
}

export function buildWhatsAppUrl(whatsapp: string, text: string): string {
  return `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

/** Slug amigável para a URL da moto: marca-modelo-ano-<id>. */
export function buildMotoSlug(moto: Pick<Moto, 'id' | 'marca' | 'modelo' | 'ano_fab'>): string {
  const base = slugify(`${moto.marca} ${moto.modelo} ${moto.ano_fab}`)
  return base ? `${base}-${moto.id}` : moto.id
}

/** URL pública absoluta da moto, preservando o domínio atual (localhost ou produção). */
export function buildMotoUrl(moto: Pick<Moto, 'id' | 'marca' | 'modelo' | 'ano_fab'>): string {
  return `${window.location.origin}/moto/${buildMotoSlug(moto)}`
}

/** Extrai o UUID da moto a partir do parâmetro de rota (slug ou id puro, para compatibilidade). */
export function extractMotoId(param: string | undefined): string | undefined {
  if (!param) return undefined
  return param.match(UUID_RE)?.[0] ?? param
}
