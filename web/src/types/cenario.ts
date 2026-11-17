/** Cenário do Jogo do Robô salvo na biblioteca do professor (GET/POST/PUT /api/professor/cenarios). */
export interface CenarioSalvo {
  id: number
  nome: string
  /** Mesmo formato do cenarioJson da atividade: o CenarioRobo serializado em texto. */
  cenarioJson: string
  criadoEm: string
  atualizadoEm: string
}

export interface CenarioSalvoPayload {
  nome: string
  cenarioJson: string
}
