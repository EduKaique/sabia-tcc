import api from '@/lib/api'
import type { Turma } from '@/types'

export async function listarTurmas(): Promise<Turma[]> {
  const { data } = await api.get<Turma[]>('/api/professor/turmas')
  return data
}
