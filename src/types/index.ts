export interface Loja {
  id: string
  nome: string
  slug: string
  logo_url: string | null
  capa_url: string | null
  slogan: string | null
  whatsapp: string | null
  instagram: string | null
  facebook: string | null
  site_url: string | null
  endereco: string | null
  cidade: string | null
  uf: string | null
  cor_primaria: string
  parcelas_cartao: number
  parcelas_financiamento: number
  ativo: boolean
  google_rating: number | null
  google_review_count: number | null
  google_url: string | null
}

export type Papel = 'admin' | 'despachante'

export interface Perfil {
  id: string
  nome: string | null
  papel: Papel
  created_at: string
}

export type BaixaEtapa = 'nova' | 'em_andamento' | 'concluida'

export interface MotoBaixa {
  id: string
  moto_id: string
  nome_comprador: string
  cpf: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  cidade: string | null
  uf: string | null
  data_venda: string | null
  valor_venda: number | null
  observacoes: string | null
  baixa_concluida: boolean
  etapa: BaixaEtapa
  iniciado_por: string | null
  iniciado_em: string | null
  concluido_em: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Avaliacao {
  id: string
  loja_id: string
  autor: string
  nota: number
  texto: string | null
  data_avaliacao: string | null
  exibir: boolean
  created_at: string
}

export interface LojaLink {
  id: string
  loja_id: string
  titulo: string
  url: string
  icone: string | null
  ordem: number
  ativo: boolean
}

export type MotoStatus = 'disponivel' | 'reservado' | 'vendido' | 'manutencao'
export type MotoCategoria = 'street' | 'trail' | 'custom' | 'scooter' | 'eletrica' | 'naked'
export type MotoCombustivel = 'gasolina' | 'flex' | 'eletrica'

export interface Moto {
  id: string
  loja_id: string
  marca: string
  modelo: string
  ano_fab: number
  ano_mod: number
  cor: string | null
  quilometragem: number | null
  preco: number
  categoria: MotoCategoria | null
  cilindrada: number | null
  combustivel: MotoCombustivel
  placa?: string | null        // apenas admin
  chassi?: string | null       // apenas admin
  descricao: string | null
  status: MotoStatus
  destaque: boolean
  publicado: boolean
  created_at: string
  updated_at: string
  fotos?: MotoFoto[]
}

export interface MotoFoto {
  id: string
  moto_id: string
  storage_path: string
  ordem: number
}

export type DocTipo =
  | 'atpv'
  | 'crlv'
  | 'laudo'
  | 'nf'
  | 'cnh'
  | 'endereco'
  | 'contrato'
  | 'outro'

export interface MotoDocumento {
  id: string
  moto_id: string
  tipo: DocTipo
  nome_arquivo: string
  storage_path: string
  tamanho_bytes: number | null
  uploaded_by: string | null
  created_at: string
}

export interface Lead {
  id: string
  loja_id: string
  moto_id: string | null
  tipo: 'interesse' | 'test_drive' | 'financiamento'
  nome: string | null
  telefone: string | null
  mensagem: string | null
  created_at: string
}

// Filtros do catálogo
export interface CatalogFilters {
  marca?: string
  categoria?: MotoCategoria
  precoMin?: number
  precoMax?: number
  status?: MotoStatus
  busca?: string
  ordenacao?: 'recentes' | 'menor_preco' | 'maior_preco' | 'menor_km'
}
