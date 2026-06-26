import api from '@/lib/api'
import type { AtividadeAlunoDTO } from '@/types/atividade'

export async function listarAtividadesAluno(): Promise<AtividadeAlunoDTO[]> {
  const { data } = await api.get<AtividadeAlunoDTO[]>('/api/aluno/atividades')
  return data
}

export async function buscarAtividadeAluno(id: number): Promise<AtividadeAlunoDTO> {
  const { data } = await api.get<AtividadeAlunoDTO>(`/api/aluno/atividades/${id}`)
  return data
}

export interface SubmeterAtividadeResponse {
  id: number
  atividadeId: number
  dataEnvio: string
  status: string
  correcao: null
}

export async function submeterAtividade(
  id: number,
  estadoJson: string,
): Promise<SubmeterAtividadeResponse> {
  const { data } = await api.post<SubmeterAtividadeResponse>(
    `/api/aluno/atividades/${id}/submeter`,
    { estadoJson },
  )
  return data
}
