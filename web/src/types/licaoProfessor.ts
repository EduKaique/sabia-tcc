import type { ModoAtividade } from '@/types'
import type { EstadoLicaoAluno } from '@/types/licao'

/** Tipos da API de autoria de lições (/api/professor/licoes). As do aluno ficam em types/licao.ts. */

export type EstadoLicaoProfessor = 'RASCUNHO' | 'PUBLICADA' | 'ARQUIVADA'

export type TipoPagina = 'TEXTO' | 'IMAGEM_TEXTO' | 'VIDEO_YOUTUBE' | 'VIDEO_UPLOAD' | 'QUESTIONARIO'

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
  estado: EstadoLicaoProfessor
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
  estado: EstadoLicaoProfessor
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
 * GET /api/professor/turmas/{turmaId}/licoes/progresso. `alunos[i].celulas[j]` corresponde a `licoes[j]`.
 * Lições: só as publicadas e vinculadas à turma (publicação ascendente). Alunos: só os matriculados, por nome.
 * Datas em UTC, sem fuso.
 */
export interface ProgressoLicoesTurma {
  turmaId: number
  turmaNome: string
  totalAlunos: number
  licoes: ColunaLicaoProgresso[]
  alunos: LinhaAlunoProgresso[]
}

export interface ColunaLicaoProgresso {
  id: number
  titulo: string
  conceito: string
  modo: ModoAtividade
  totalPaginas: number
  publicadaEm: string
  /** Alunos matriculados com a lição concluída. */
  concluiram: number
}

export interface LinhaAlunoProgresso {
  alunoId: number
  nome: string
  celulas: CelulaProgressoLicao[]
}

export interface CelulaProgressoLicao {
  licaoId: number
  estado: EstadoLicaoAluno
  paginasConcluidas: number
  /** Média inteira dos melhores percentuais dos questionários tentados; null sem tentativa. */
  melhorPercentualQuestionario: number | null
  atividadeConcluida: boolean
  concluidaEm: string | null
}
