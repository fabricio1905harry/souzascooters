import { supabase } from './supabase'
import type { Lead } from '../types'

/** Insere o lead e dispara webhook n8n (fire and forget). */
export async function notificarLead(lead: Partial<Lead>) {
  // 1. Inserir no banco
  const { data, error } = await supabase.from('leads').insert(lead).select().single()
  if (error) throw error

  // 2. Disparar webhook n8n (fire and forget)
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(console.error)  // não bloqueia UI em caso de falha
  }

  return data as Lead
}

/** Registra clique para analytics (fire and forget). */
export function registrarClick(params: {
  loja_id: string
  link_id?: string
  moto_id?: string
  tipo: 'link' | 'whatsapp' | 'catalogo' | 'moto_detalhe'
}) {
  supabase
    .from('link_clicks')
    .insert(params)
    .then(({ error }) => {
      if (error) console.error('link_clicks:', error.message)
    })
}
