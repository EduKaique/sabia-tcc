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
  turmaId: number
  pontuacaoMaxima: number
  dataEntrega: Date | undefined
  eGeradaIa: boolean
  status: StatusAtividade
  criadaEm: string
}

export interface Turma {
  id: number
  nome: string
}

export interface AtividadeDetalhes {
  id: string
  titulo: string
  descricao: string
  turmaNome: string
  dataEntrega: string | null
  pontuacaoMaxima: number
  status: 'RASCUNHO' | 'PUBLICADA'
  eGeradaIa: boolean
  criadaEm: string
  totalAlunos: number
  totalEntregas: number
  mediaTurma: number | null
}

export type StatusSubmissao = 'PENDENTE' | 'EM_CORRECAO' | 'CORRIGIDA'

export interface SubmissaoItem {
  id: string
  alunoId: string
  alunoNome: string
  alunoFotoUrl: string | null
  nomeArquivo: string | null
  entregueComAtraso: boolean
  status: StatusSubmissao
  nota: number | null
  dataEnvio: string | null
}
