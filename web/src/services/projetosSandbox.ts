import api from '@/lib/pedagogicoApi'
import type {
  AtualizarProjetoSandboxPayload,
  CriarProjetoSandboxPayload,
  ProjetoSandboxDetalhe,
  ProjetoSandboxResumo,
} from '@/types/projetoSandbox'

export const BASE_PROJETOS_SANDBOX = '/api/aluno/projetos'

export async function listarProjetosSandbox(): Promise<ProjetoSandboxResumo[]> {
  const { data } = await api.get<ProjetoSandboxResumo[]>(BASE_PROJETOS_SANDBOX)
  return data
}

export async function buscarProjetoSandbox(id: number): Promise<ProjetoSandboxDetalhe> {
  const { data } = await api.get<ProjetoSandboxDetalhe>(`${BASE_PROJETOS_SANDBOX}/${id}`)
  return data
}

export async function criarProjetoSandbox(payload: CriarProjetoSandboxPayload): Promise<ProjetoSandboxDetalhe> {
  const { data } = await api.post<ProjetoSandboxDetalhe>(BASE_PROJETOS_SANDBOX, payload)
  return data
}

export async function atualizarProjetoSandbox(
  id: number,
  payload: AtualizarProjetoSandboxPayload,
): Promise<ProjetoSandboxDetalhe> {
  const { data } = await api.put<ProjetoSandboxDetalhe>(`${BASE_PROJETOS_SANDBOX}/${id}`, payload)
  return data
}

export async function excluirProjetoSandbox(id: number): Promise<void> {
  await api.delete(`${BASE_PROJETOS_SANDBOX}/${id}`)
}

/** "Continuar no Sandbox": copia o projeto entregue de uma atividade corrigida. */
export async function copiarAtividadeParaSandbox(atividadeId: number): Promise<ProjetoSandboxDetalhe> {
  const { data } = await api.post<ProjetoSandboxDetalhe>(`/api/aluno/atividades/${atividadeId}/sandbox`)
  return data
}
