import type { ModoAtividade, ResultadoValidacao } from '@/types'

/**
 * Tipos da API do aluno (/api/aluno/licoes). Os do professor ficam em types/licaoProfessor.ts.
 * Datas (`concluidaEm`, `vistaEm`) vêm em UTC, sem fuso.
 */

export type EstadoLicaoAluno = 'NAO_INICIADA' | 'EM_ANDAMENTO' | 'PRATICA_LIBERADA' | 'CONCLUIDA'

export type TipoPaginaAluno = 'TEXTO' | 'IMAGEM_TEXTO' | 'VIDEO_YOUTUBE' | 'VIDEO_UPLOAD' | 'QUESTIONARIO'

/** Item de GET /api/aluno/licoes. `turmas`: só as turmas do aluno às quais a lição está vinculada. */
export interface LicaoResumo {
  id: number
  titulo: string
  conceito: string
  resumo: string | null
  modo: ModoAtividade
  estado: EstadoLicaoAluno
  totalPaginas: number
  paginasConcluidas: number
  atividadeConcluida: boolean
  concluidaEm: string | null
  turmas: { id: number; nome: string }[]
}

export interface ConteudoTextoAluno {
  html: string
}

export interface ConteudoImagemTextoAluno {
  imagemUrl: string
  alt: string
  legenda?: string
  html?: string
}

export interface ConteudoVideoAluno {
  videoId: string
  titulo?: string
  canal?: string
  duracaoSegundos?: number
}

/** Questionário na visão do aluno: sem a alternativa certa. */
export interface ConteudoQuestionarioAluno {
  percentualMinimo: number
  perguntas: { enunciado: string; alternativas: string[] }[]
}

export interface ProgressoVideo {
  segundosCreditados: number
  segundosNecessarios: number
  conferido: boolean
}

export interface ProgressoQuestionario {
  tentativas: number
  melhorPercentual: number | null
  aprovado: boolean
}

/** `video` só em VIDEO_YOUTUBE com duração e `questionario` só em QUESTIONARIO (campos ausentes não vêm). */
export interface ProgressoPagina {
  concluida: boolean
  vistaEm?: string
  video?: ProgressoVideo
  questionario?: ProgressoQuestionario
}

export interface PaginaAluno {
  id: number
  ordem: number
  tipo: TipoPaginaAluno
  titulo: string | null
  conteudo: unknown
  progresso: ProgressoPagina
}

/** GET /api/aluno/licoes/{id}. */
export interface LicaoDetalhe {
  id: number
  titulo: string
  conceito: string
  resumo: string | null
  modo: ModoAtividade
  /** Texto JSON no modo JOGO_ROBO (ler com lerCenario); null em BLOCOS. */
  cenarioJson: string | null
  /** Último workspace salvo; null antes do primeiro autosave. */
  estadoJson: string | null
  atividadeConcluida: boolean
  concluidaEm: string | null
  estado: EstadoLicaoAluno
  praticaLiberada: boolean
  paginas: PaginaAluno[]
}

/** POST .../paginas/{paginaId}/vista. */
export interface VistaPagina {
  paginaId: number
  concluida: boolean
  praticaLiberada: boolean
}

/** POST .../paginas/{paginaId}/video/pulso: crédito medido pelo relógio do servidor. */
export interface PulsoVideo extends ProgressoVideo {
  paginaId: number
  praticaLiberada: boolean
}

/** POST .../paginas/{paginaId}/questionario. Diz SE cada pergunta está certa, nunca QUAL é a certa. */
export interface CorrecaoQuestionario {
  paginaId: number
  acertos: number
  total: number
  percentual: number
  /** Desta tentativa. */
  aprovado: boolean
  /** Acumulado: uma vez aprovado, nunca desfeito. */
  aprovadoNaPagina: boolean
  melhorPercentual: number
  tentativas: number
  perguntas: { certa: boolean }[]
  praticaLiberada: boolean
}

/** Resposta do autosave (PUT /estado). */
export interface ProgressoLicao {
  atividadeConcluida: boolean
  concluida: boolean
  concluidaEm: string | null
}

/** POST /api/aluno/licoes/{id}/concluir-atividade: o veredito do servidor. */
export interface ConclusaoAtividade extends ProgressoLicao {
  validacao: ResultadoValidacao | null
}
