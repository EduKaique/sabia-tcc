import type { ModoAtividade } from '@/types'

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
