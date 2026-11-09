import api from '@/lib/pedagogicoApi'
import type { LicaoDetalhe, LicaoResumo, ProgressoLicao } from '@/types/licao'

export async function listarLicoes(): Promise<LicaoResumo[]> {
  const { data } = await api.get<LicaoResumo[]>('/api/aluno/licoes')
  return data
}

export async function buscarLicao(id: number): Promise<LicaoDetalhe> {
  const { data } = await api.get<LicaoDetalhe>(`/api/aluno/licoes/${id}`)
  return data
}

export async function marcarVideoVisto(id: number): Promise<ProgressoLicao> {
  const { data } = await api.post<ProgressoLicao>(`/api/aluno/licoes/${id}/video-visto`)
  return data
}

export async function salvarEstadoLicao(id: number, estadoJson: string): Promise<ProgressoLicao> {
  const { data } = await api.put<ProgressoLicao>(`/api/aluno/licoes/${id}/estado`, { estadoJson })
  return data
}

export async function concluirAtividadeLicao(id: number, estadoJson: string): Promise<ProgressoLicao> {
  const { data } = await api.post<ProgressoLicao>(`/api/aluno/licoes/${id}/concluir-atividade`, {
    estadoJson,
  })
  return data
}
