import api from '@/lib/pedagogicoApi'
import type {
  ConclusaoAtividade,
  CorrecaoQuestionario,
  LicaoDetalhe,
  LicaoResumo,
  ProgressoLicao,
  PulsoVideo,
  VistaPagina,
} from '@/types/licao'

const BASE = '/api/aluno/licoes'

export async function listarLicoes(): Promise<LicaoResumo[]> {
  const { data } = await api.get<LicaoResumo[]>(BASE)
  return data
}

export async function buscarLicao(id: number): Promise<LicaoDetalhe> {
  const { data } = await api.get<LicaoDetalhe>(`${BASE}/${id}`)
  return data
}

/** Registra que o aluno abriu a página (idempotente; conclui texto e imagem). */
export async function marcarPaginaVista(id: number, paginaId: number): Promise<VistaPagina> {
  const { data } = await api.post<VistaPagina>(`${BASE}/${id}/paginas/${paginaId}/vista`)
  return data
}

/** Pulso do player enquanto o vídeo toca; o servidor credita o tempo pelo próprio relógio. */
export async function enviarPulsoVideo(id: number, paginaId: number): Promise<PulsoVideo> {
  const { data } = await api.post<PulsoVideo>(`${BASE}/${id}/paginas/${paginaId}/video/pulso`)
  return data
}

/** Uma tentativa do questionário: um índice de alternativa por pergunta, na ordem. */
export async function enviarQuestionario(
  id: number,
  paginaId: number,
  respostas: number[]
): Promise<CorrecaoQuestionario> {
  const { data } = await api.post<CorrecaoQuestionario>(`${BASE}/${id}/paginas/${paginaId}/questionario`, {
    respostas,
  })
  return data
}

export async function salvarEstadoLicao(id: number, estadoJson: string): Promise<ProgressoLicao> {
  const { data } = await api.put<ProgressoLicao>(`${BASE}/${id}/estado`, { estadoJson })
  return data
}

/** O servidor valida o projeto e decide se a prática foi concluída. */
export async function concluirAtividadeLicao(id: number, estadoJson: string): Promise<ConclusaoAtividade> {
  const { data } = await api.post<ConclusaoAtividade>(`${BASE}/${id}/concluir-atividade`, { estadoJson })
  return data
}
