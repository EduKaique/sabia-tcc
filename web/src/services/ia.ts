import api from '@/lib/api'
import type { AnaliseRobo, CenarioRobo, RelatorioIa, TipoAtividade } from '@/types'

export interface GerarAtividadeIaPayload {
  idTurma: number
  tipoAtividade: TipoAtividade
  descricaoObjetivo: string
}

export interface GerarAtividadeIaRequest {
  titulo: string
  descricao: string
  gabaritoEstadoJson?: string
}

/** Contexto do Jogo do Robô para o relatório: métricas e pseudocódigo calculados pelo servidor. */
export interface ContextoRoboIa {
  cenario: CenarioRobo
  metricas: Omit<AnaliseRobo, 'pseudocodigo'>
  pseudocodigo: string
}

export interface RevisarSubmissaoIaPayload {
  atividade: {
    titulo: string
    descricao: string | null
    pontuacaoMaxima: number
    gabaritoEstadoJson: string | null
  },
  submissaoEstadoJson: string,
  /** Só no Jogo do Robô: o ia-service usa o prompt do robô e devolve a nota sugerida nula. */
  contextoRobo?: ContextoRoboIa
}

export type RevisarSubmissaoIaResponse = RelatorioIa


export async function gerarAtividadeComIa(
  payload: GerarAtividadeIaPayload,
): Promise<GerarAtividadeIaRequest> {
  const { data } = await api.post<GerarAtividadeIaRequest>('/api/ia/atividade/gerar', payload)
  return data
}

export async function revisarSubmissaoComIa(
  payload: RevisarSubmissaoIaPayload,
): Promise<RevisarSubmissaoIaResponse> {
  const { data } = await api.post<RevisarSubmissaoIaResponse>(
    '/api/ia/submissao/revisar',
    payload,
  )
  return data
}

export type DificuldadeCenario = 'FACIL' | 'MEDIO' | 'DIFICIL'

export interface ParametrosCenarioIa {
  linhas: number
  colunas: number
  dificuldade: DificuldadeCenario
  usarRepetir: boolean
}

export interface GerarAtividadeRoboPayload {
  idTurma?: number
  descricaoObjetivo: string
  /** Obrigatório quando sugerirCenario for falso. */
  cenario?: CenarioRobo
  sugerirCenario: boolean
  parametrosCenario?: ParametrosCenarioIa
}

export interface GerarAtividadeRoboResposta {
  titulo: string
  descricao: string
  /** Só vem quando sugerirCenario for verdadeiro. */
  cenario?: CenarioRobo
}

export async function gerarAtividadeRoboComIa(
  payload: GerarAtividadeRoboPayload,
): Promise<GerarAtividadeRoboResposta> {
  const { data } = await api.post<GerarAtividadeRoboResposta>(
    '/api/ia/atividade/gerar-robo',
    payload,
  )
  return data
}
