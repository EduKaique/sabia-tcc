import { lerCenario } from '@/lib/cenariosRobo'
import { validarFormaCenario } from '@/lib/editorCenario'
import type {
  GerarAtividadeRoboPayload,
  GerarAtividadeRoboResposta,
  ParametrosCenarioIa,
} from '@/services/ia'
import type { CenarioRobo } from '@/types'

/** Mesmo limite da rota /atividade/gerar-robo do ia-service. */
export const MAX_OBJETIVO_ROBO = 1000
/** Mesmo limite do nome de cenário no pedagogico-service (CenarioRoboRequest). */
export const MAX_NOME_CENARIO = 100
const MIN_NOME_CENARIO = 3
export const NOME_CENARIO_SUGERIDO = 'Cenário sugerido pela IA'

export const PARAMETROS_CENARIO_PADRAO: ParametrosCenarioIa = {
  linhas: 5,
  colunas: 5,
  dificuldade: 'FACIL',
  usarRepetir: false,
}

export const MENSAGEM_SEM_CENARIO =
  'Escolha um cenário no formulário antes de gerar, ou marque "Sugerir também um cenário".'

export interface DadosPedidoRobo {
  idTurma?: number | null
  descricaoObjetivo: string
  /** Cenário resolvido no formulário (opção escolhida + limite de blocos), ou null. */
  cenario: CenarioRobo | null
  sugerirCenario: boolean
  parametros?: ParametrosCenarioIa
}

/**
 * Monta o pedido para /atividade/gerar-robo a partir do formulário.
 * Sem cenário resolvido e sem pedir sugestão, devolve um erro e não há chamada à IA.
 */
export function montarPedidoRobo(
  dados: DadosPedidoRobo,
): { pedido: GerarAtividadeRoboPayload } | { erro: string } {
  const descricaoObjetivo = dados.descricaoObjetivo.trim()
  const base = {
    descricaoObjetivo,
    ...(dados.idTurma ? { idTurma: dados.idTurma } : {}),
  }
  if (dados.sugerirCenario) {
    return {
      pedido: {
        ...base,
        sugerirCenario: true,
        parametrosCenario: dados.parametros ?? PARAMETROS_CENARIO_PADRAO,
      },
    }
  }
  if (!dados.cenario) return { erro: MENSAGEM_SEM_CENARIO }
  return { pedido: { ...base, sugerirCenario: false, cenario: dados.cenario } }
}

/** Nome padrão do cenário sugerido: o título gerado, truncado ao limite do nome. */
export function nomePadraoCenario(titulo: string): string {
  const nome = titulo.trim().slice(0, MAX_NOME_CENARIO).trim()
  return nome.length >= MIN_NOME_CENARIO ? nome : NOME_CENARIO_SUGERIDO
}

/**
 * Confere o cenário recebido da IA antes de abri-lo no editor: estrutura (lerCenario) e forma
 * (validarFormaCenario). O caminho até o destino é validado pelo servidor ao salvar.
 */
export function cenarioRecebidoValido(cenario: unknown): CenarioRobo | null {
  if (cenario == null) return null
  const lido = lerCenario(JSON.stringify(cenario))
  if (!lido) return null
  return validarFormaCenario(lido) === null ? lido : null
}

/** Valor inicial do EditorCenario para a sugestão; null quando não veio cenário válido. */
export function valorInicialEditor(
  resposta: GerarAtividadeRoboResposta,
): { nome: string; cenario: CenarioRobo } | null {
  const cenario = cenarioRecebidoValido(resposta.cenario)
  return cenario ? { nome: nomePadraoCenario(resposta.titulo), cenario } : null
}
