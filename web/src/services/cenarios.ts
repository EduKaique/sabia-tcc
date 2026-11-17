import api from '@/lib/pedagogicoApi'
import type { CenarioSalvo, CenarioSalvoPayload } from '@/types/cenario'

export async function listarCenarios(): Promise<CenarioSalvo[]> {
  const { data } = await api.get<CenarioSalvo[]>('/api/professor/cenarios')
  return data
}

export async function criarCenario(payload: CenarioSalvoPayload): Promise<CenarioSalvo> {
  const { data } = await api.post<CenarioSalvo>('/api/professor/cenarios', payload)
  return data
}

export async function atualizarCenario(id: number, payload: CenarioSalvoPayload): Promise<CenarioSalvo> {
  const { data } = await api.put<CenarioSalvo>(`/api/professor/cenarios/${id}`, payload)
  return data
}

export async function excluirCenario(id: number): Promise<void> {
  await api.delete(`/api/professor/cenarios/${id}`)
}
