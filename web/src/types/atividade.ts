import type { ModoAtividade } from '@/types'

export type StatusAtividadeAluno = 'PENDENTE' | 'EM_ANDAMENTO' | 'ENTREGUE' | 'CORRIGIDA'

export interface AtividadeAlunoDTO {
  id: number
  titulo: string
  descricao: string
  dataEntrega: string
  pontuacaoMaxima: number
  status: StatusAtividadeAluno
  modo: ModoAtividade
  cenarioJson: string | null
}
