export type StatusAtividadeAluno = 'PENDENTE' | 'EM_ANDAMENTO' | 'ENTREGUE' | 'CORRIGIDA'

export interface AtividadeAlunoDTO {
  id: number
  titulo: string
  descricao: string
  dataEntrega: string
  pontuacaoMaxima: number
  status: StatusAtividadeAluno
}
