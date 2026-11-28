/** Projetos do Sandbox ("Meus Projetos"): privados do aluno, sem nota e sem entrega. */

import type { ModoPratica } from '@/types'

export const LIMITE_PROJETOS_SANDBOX = 10

export interface ProjetoSandboxResumo {
  id: number
  nome: string
  modo: ModoPratica
  /** LocalDateTime em UTC, sem fuso (ler com parseDataUtc). */
  atualizadoEm: string
}

export interface ProjetoSandboxDetalhe extends ProjetoSandboxResumo {
  estadoJson: string | null
  /** Snapshot do cenário (só no modo JOGO_ROBO). */
  cenarioJson: string | null
  origemAtividadeId: number | null
  criadoEm: string
}

export interface CriarProjetoSandboxPayload {
  nome?: string
  modo: ModoPratica
  /** Id de um cenário pronto (PRESETS_CENARIO); obrigatório no modo JOGO_ROBO. */
  cenario?: string
}

export interface AtualizarProjetoSandboxPayload {
  nome?: string
  estadoJson?: string
}
