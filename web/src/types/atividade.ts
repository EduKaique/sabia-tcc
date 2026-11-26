import type { ModoAtividade } from '@/types'

export type StatusAtividadeAluno = 'PENDENTE' | 'ENTREGUE' | 'CORRIGIDA'

export interface AtividadeAlunoDTO {
  id: number
  titulo: string
  descricao: string
  dataEntrega: string
  pontuacaoMaxima: number
  status: StatusAtividadeAluno
  modo: ModoAtividade
  cenarioJson: string | null
  /** Nota, comentário e data da correção: só vêm preenchidos quando status é CORRIGIDA. */
  nota: number | null
  feedbackProfessor: string | null
  corrigidaEm: string | null
}

/** Projeto entregue pelo próprio aluno (somente leitura). */
export interface ProjetoEntregueDTO {
  estadoJson: string | null
  enviadaEm: string
}
