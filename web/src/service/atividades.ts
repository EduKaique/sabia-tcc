import api from '@/lib/api'
import type { AtividadeAvaliativa } from '@/types'

export interface CriarAtividadePayload {
  titulo: string
  descricao: string
  turmaId: string
  pontuacaoMaxima: number
  dataEntrega: string | null
}

export async function listarAtividades(): Promise<AtividadeAvaliativa[]> {
  const { data } = await api.get<AtividadeAvaliativa[]>('/api/professor/atividades')
  return data
}

export async function buscarAtividade(id: string): Promise<AtividadeAvaliativa> {
  const { data } = await api.get<AtividadeAvaliativa>(`/api/professor/atividades/${id}`)
  return data
}

export async function criarAtividade(payload: CriarAtividadePayload): Promise<AtividadeAvaliativa> {
  const { data } = await api.post<AtividadeAvaliativa>('/api/professor/atividades', payload)
  return data
}

export async function atualizarAtividade(
  id: string,
  payload: Partial<CriarAtividadePayload>,
): Promise<AtividadeAvaliativa> {
  const { data } = await api.put<AtividadeAvaliativa>(`/api/professor/atividades/${id}`, payload)
  return data
}

export async function publicarAtividade(id: string): Promise<AtividadeAvaliativa> {
  const { data } = await api.patch<AtividadeAvaliativa>(`/api/professor/atividades/${id}/publicar`)
  return data
}

export async function despublicarAtividade(id: string): Promise<AtividadeAvaliativa> {
  const { data } = await api.patch<AtividadeAvaliativa>(
    `/api/professor/atividades/${id}/despublicar`,
  )
  return data
}

export async function deletarAtividade(id: string): Promise<void> {
  await api.delete(`/api/professor/atividades/${id}`)
}
