import { MessageCircle } from 'lucide-react'
import { buildWhatsAppUrl } from '../../lib/helpers'
import { registrarClick } from '../../lib/leads'

interface Props {
  whatsapp: string
  lojaId: string
  texto?: string
}

export default function WhatsAppFAB({ whatsapp, lojaId, texto = 'Olá! Vim pelo catálogo.' }: Props) {
  function handleClick() {
    registrarClick({ loja_id: lojaId, tipo: 'whatsapp' })
    window.open(buildWhatsAppUrl(whatsapp, texto), '_blank')
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-105 hover:bg-green-600"
    >
      <MessageCircle className="h-7 w-7" />
    </button>
  )
}
