import api from '@/lib/pedagogicoApi'
import type {
  CriarLicaoPayload,
  LicaoProfessorDetalhe,
  LicaoProfessorResumo,
  SalvarLicaoPayload,
} from '@/types/licaoProfessor'

const BASE = '/api/professor/licoes'

export async function listarLicoesProfessor(turmaId?: number): Promise<LicaoProfessorResumo[]> {
  const { data } = await api.get<LicaoProfessorResumo[]>(BASE, {
    params: turmaId ? { turmaId } : undefined,
  })
  return data
}

export async function criarLicao(payload: CriarLicaoPayload): Promise<LicaoProfessorDetalhe> {
  const { data } = await api.post<LicaoProfessorDetalhe>(BASE, payload)
  return data
}

export async function buscarLicaoProfessor(id: number): Promise<LicaoProfessorDetalhe> {
  const { data } = await api.get<LicaoProfessorDetalhe>(`${BASE}/${id}`)
  return data
}

export async function salvarLicao(id: number, payload: SalvarLicaoPayload): Promise<LicaoProfessorDetalhe> {
  const { data } = await api.put<LicaoProfessorDetalhe>(`${BASE}/${id}`, payload)
  return data
}

export async function vincularTurmasLicao(id: number, turmaIds: number[]): Promise<LicaoProfessorDetalhe> {
  const { data } = await api.put<LicaoProfessorDetalhe>(`${BASE}/${id}/turmas`, { turmaIds })
  return data
}

export async function publicarLicao(id: number): Promise<LicaoProfessorDetalhe> {
  const { data } = await api.post<LicaoProfessorDetalhe>(`${BASE}/${id}/publicar`)
  return data
}

export async function despublicarLicao(id: number): Promise<LicaoProfessorDetalhe> {
  const { data } = await api.post<LicaoProfessorDetalhe>(`${BASE}/${id}/despublicar`)
  return data
}

export async function arquivarLicao(id: number): Promise<void> {
  await api.delete(`${BASE}/${id}`)
}
