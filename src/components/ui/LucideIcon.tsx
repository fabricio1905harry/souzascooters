import {
  AtSign,
  Bike,
  Calendar,
  Clapperboard,
  CreditCard,
  Globe,
  Link as LinkIcon,
  Mail,
  Map,
  MapPin,
  MessageCircle,
  Music,
  Phone,
  ShoppingBag,
  Star,
  Wrench,
  type LucideIcon as LucideIconType,
  type LucideProps,
} from 'lucide-react'

/**
 * Conjunto fixo de ícones disponíveis para loja_links.icone.
 * Evita importar o mapa completo do lucide-react (~600 KB) no bundle público.
 * Obs: ícones de marca (Instagram/Facebook/Youtube) não existem mais no lucide —
 * use AtSign, Globe e Clapperboard como equivalentes.
 */
const ICONS: Record<string, LucideIconType> = {
  AtSign,
  Bike,
  Calendar,
  Clapperboard,
  CreditCard,
  Globe,
  Link: LinkIcon,
  Mail,
  Map,
  MapPin,
  MessageCircle,
  Music,
  Phone,
  ShoppingBag,
  Star,
  Wrench,
  // aliases amigáveis para nomes salvos no banco
  Instagram: AtSign,
  Facebook: Globe,
  Youtube: Clapperboard,
  WhatsApp: MessageCircle,
}

/** Nomes de ícones oferecidos no painel admin ao cadastrar um link. */
export const ICON_OPTIONS = Object.keys(ICONS).sort()

interface Props extends Omit<LucideProps, 'name'> {
  name: string | null
}

/** Renderiza um ícone Lucide pelo nome salvo no banco (PascalCase). */
export default function LucideIcon({ name, ...props }: Props) {
  const Icon = (name && ICONS[name]) || LinkIcon
  return <Icon {...props} />
}
