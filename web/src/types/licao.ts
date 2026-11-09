import type { ModoAtividade } from '@/types'

/** Espelha ProgressoLicaoResponse (pedagogico-service). `concluidaEm` vem em UTC, sem fuso. */
export interface ProgressoLicao {
  videoVisto: boolean
  atividadeConcluida: boolean
  concluida: boolean
  concluidaEm: string | null
}

/** Espelha LicaoResumoResponse (item de GET /api/aluno/licoes). */
export interface LicaoResumo {
  id: number
  codigo: string
  ordem: number
  titulo: string
  resumo: string | null
  conceito: string
  habilidadeBncc: string | null
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
  habilidadeBncc: string | null
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
