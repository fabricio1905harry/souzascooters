import type { BaixaEtapa, MotoStatus } from '../types'

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
  disponivel: 'bg-green-100 text-green-800',
  reservado: 'bg-amber-100 text-amber-800',
  vendido: 'bg-red-100 text-red-800',
  manutencao: 'bg-gray-100 text-gray-600',
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
