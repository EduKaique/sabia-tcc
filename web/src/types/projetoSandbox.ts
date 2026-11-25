/** Projetos do Sandbox ("Meus Projetos"): privados do aluno, sem nota e sem entrega. */

export type ModoProjetoSandbox = 'BLOCOS_LIVRES' | 'ROBO'

export const LIMITE_PROJETOS_SANDBOX = 10

export interface ProjetoSandboxResumo {
  id: number
  nome: string
  modo: ModoProjetoSandbox
  /** LocalDateTime em UTC, sem fuso (ler com parseDataUtc). */
  atualizadoEm: string
}

export interface ProjetoSandboxDetalhe extends ProjetoSandboxResumo {
  estadoJson: string | null
  /** Snapshot do cenário (só no modo ROBO). */
  cenarioJson: string | null
  origemAtividadeId: number | null
  criadoEm: string
}

export interface CriarProjetoSandboxPayload {
  nome?: string
  modo: ModoProjetoSandbox
  /** Id de um cenário pronto (PRESETS_CENARIO); obrigatório no modo ROBO. */
  cenario?: string
}

export interface AtualizarProjetoSandboxPayload {
  nome?: string
  estadoJson?: string
}
