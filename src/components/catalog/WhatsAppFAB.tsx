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
      className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lift transition-all hover:scale-105 hover:bg-green-600"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-green-500/40 [animation-duration:2.5s]" />
      <MessageCircle className="h-7 w-7 transition-transform group-hover:rotate-6" />
    </button>
  )
}
