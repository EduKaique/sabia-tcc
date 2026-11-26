import type { ModoAtividade } from '@/types'
import type { EstadoLicaoAluno, TipoPagina } from '@/types/licao'

/** Tipos da API de autoria de lições (/api/professor/licoes). As do aluno ficam em types/licao.ts. */

export type EstadoPublicacaoLicao = 'RASCUNHO' | 'PUBLICADA' | 'ARQUIVADA'

export interface ConteudoTexto {
  html: string
}

export interface ConteudoImagemTexto {
  imagemUrl: string
  alt: string
  legenda?: string
  html?: string
}

export interface ConteudoVideoYoutube {
  videoId: string
  titulo?: string
  canal?: string
  duracaoSegundos?: number
}

export interface ConteudoQuestionario {
  percentualMinimo: number
  perguntas: { enunciado: string; alternativas: string[]; correta: number }[]
}

/** Página como o servidor devolve: o conteúdo é um objeto (com o gabarito, no questionário). */
export interface PaginaLicaoProfessor {
  id: number
  ordem: number
  tipo: TipoPagina
  titulo: string | null
  conteudo: unknown
}

export interface LicaoProfessorResumo {
  id: number
  estado: EstadoPublicacaoLicao
  titulo: string
  conceito: string
  resumo: string | null
  modo: ModoAtividade
  turmas: { id: number; nome: string }[]
  quantidadePaginas: number
  atualizadaEm: string | null
}

export interface LicaoProfessorDetalhe {
  id: number
  estado: EstadoPublicacaoLicao
  titulo: string
  conceito: string
  resumo: string | null
  modo: ModoAtividade
  cenarioJson: string | null
  turmaIds: number[]
  paginas: PaginaLicaoProfessor[]
  publicadaEm: string | null
  criadaEm: string | null
  atualizadaEm: string | null
}

export interface CriarLicaoPayload {
  titulo: string
  conceito: string
  resumo?: string | null
}

export interface PaginaLicaoPayload {
  id?: number
  tipo: TipoPagina
  titulo: string | null
  conteudo: unknown
}

export interface SalvarLicaoPayload {
  titulo: string
  conceito: string
  resumo: string | null
  modo: ModoAtividade
  cenarioJson: string | null
  paginas: PaginaLicaoPayload[]
}

/**
 * GET /api/professor/licoes/{id}/progresso: alunos das turmas vinculadas, por turma. `alunos[i].paginas[j]`
 * corresponde a `paginas[j]`. `totalAlunos` e `concluiram` contam alunos distintos. Datas em UTC, sem fuso.
 */
export interface ProgressoLicaoProfessor {
  licao: {
    id: number
    titulo: string
    conceito: string
    modo: ModoAtividade
    estado: EstadoPublicacaoLicao
    publicadaEm: string | null
  }
  paginas: { id: number; ordem: number; tipo: TipoPagina; titulo: string | null }[]
  totalAlunos: number
  concluiram: number
  turmas: TurmaProgressoLicao[]
}

export interface TurmaProgressoLicao {
  turmaId: number
  turmaNome: string
  alunos: AlunoProgressoLicao[]
}

export interface AlunoProgressoLicao {
  alunoId: number
  nome: string
  estado: EstadoLicaoAluno
  paginasConcluidas: number
  /** Média inteira dos melhores percentuais dos questionários tentados; null sem tentativa. */
  melhorPercentualQuestionario: number | null
  atividadeConcluida: boolean
  concluidaEm: string | null
  paginas: PaginaProgressoAluno[]
}

/** `melhorPercentual` e `tentativas`: só em questionário já tentado. */
export interface PaginaProgressoAluno {
  paginaId: number
  concluida: boolean
  melhorPercentual: number | null
  tentativas: number | null
}
