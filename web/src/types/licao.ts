import type { ModoAtividade, ResultadoValidacao } from '@/types'

/** Espelha ProgressoLicaoResponse (pedagogico-service). `concluidaEm` vem em UTC, sem fuso. */
export interface ProgressoLicao {
  videoVisto: boolean
  atividadeConcluida: boolean
  concluida: boolean
  concluidaEm: string | null
}

/** Espelha ConclusaoAtividadeResponse (POST /api/aluno/licoes/{id}/concluir-atividade): o veredito do servidor. */
export interface ConclusaoAtividade extends ProgressoLicao {
  validacao: ResultadoValidacao | null
}

/** Espelha LicaoResumoResponse (item de GET /api/aluno/licoes). */
export interface LicaoResumo {
  id: number
  codigo: string
  ordem: number
  titulo: string
  resumo: string | null
  conceito: string
  modo: ModoAtividade
  videoId: string | null
  progresso: ProgressoLicao
}

/** Espelha LicaoDetalheResponse (GET /api/aluno/licoes/{id}). */
export interface LicaoDetalhe {
  id: number
  codigo: string
  ordem: number
  titulo: string
  resumo: string | null
  /** HTML; exibir sempre via sanitizarHtml. */
  conteudo: string | null
  conceito: string
  videoId: string | null
  videoTitulo: string | null
  videoCanal: string | null
  modo: ModoAtividade
  /** Texto JSON no modo JOGO_ROBO (ler com lerCenario); null em BLOCOS. */
  cenarioJson: string | null
  progresso: ProgressoLicao
  /** Último workspace salvo; null antes do primeiro autosave. */
  estadoJson: string | null
}
