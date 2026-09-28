import api from '@/lib/pedagogicoApi'
import type { EtapaEnsino, Turma, Turno } from '@/types'

export interface TurmaPayload {
  nome: string
  etapa: EtapaEnsino
  anoSerie: string
  turno: Turno
}

export async function listarTurmas(): Promise<Turma[]> {
  const { data } = await api.get<Turma[]>('/api/professor/turmas')
  return data
}

export async function criarTurma(payload: TurmaPayload): Promise<Turma> {
  const { data } = await api.post<Turma>('/api/professor/turmas', payload)
  return data
}

export async function atualizarTurma(id: number, payload: TurmaPayload): Promise<Turma> {
  const { data } = await api.put<Turma>(`/api/professor/turmas/${id}`, payload)
  return data
}

export async function excluirTurma(id: number): Promise<void> {
  await api.delete(`/api/professor/turmas/${id}`)
}
