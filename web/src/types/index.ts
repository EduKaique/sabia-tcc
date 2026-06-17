export interface ApiResponse<T> {
  data: T
  message?: string
  timestamp: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export type StatusAtividade = 'RASCUNHO' | 'PUBLICADA'

export interface AtividadeAvaliativa {
  id: string
  titulo: string
  descricao: string | null
  turmaId: string
  pontuacaoMaxima: number
  dataEntrega: string | null
  eGeradaIa: boolean
  status: StatusAtividade
  criadaEm: string
}

export interface Turma {
  id: string
  nome: string
}
