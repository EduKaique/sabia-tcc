import type { Simulacao, StatusSimulacao } from '@/lib/simuladorRobo'
import type { CenarioRobo, PosicaoRobo, ResultadoValidacao } from '@/types'

/** De onde veio o resultado mostrado na correção. */
export type OrigemResultado = 'servidor' | 'navegador'

/** Resultado do Jogo do Robô na tela de correção, venha do servidor ou da simulação no navegador. */
export interface ResultadoPraticaRobo {
  origem: OrigemResultado
  status: StatusSimulacao
  concluida: boolean
  blocosUsados: number
  totalBlocosWorkspace: number
  maxBlocos: number | null
  passosExecutados: number
  posicaoFinal: PosicaoRobo | null
  blocosSoltos: number
  motivo: string | null
  avisos: string[]
}

const STATUS_ROBO: readonly StatusSimulacao[] = [
  'CHEGOU',
  'NAO_CHEGOU',
  'COLIDIU',
  'SAIU_DO_GRID',
  'SEM_BLOCOS',
  'LIMITE_EXCEDIDO',
]

/**
 * Usa o resultado validado no servidor quando existir; senão (entrega antiga), a simulação feita
 * no navegador, que não verifica limite de blocos nem blocos permitidos. Null se não houver nenhum.
 */
export function resultadoPraticaRobo(
  validacao: ResultadoValidacao | null | undefined,
  simulacao: Simulacao | null,
  cenario: CenarioRobo | null,
): ResultadoPraticaRobo | null {
  if (validacao && validacao.modo === 'JOGO_ROBO' && STATUS_ROBO.includes(validacao.status as StatusSimulacao)) {
    const avisos: string[] = []
    if (validacao.excedeuLimiteBlocos) {
      avisos.push(`Passou do limite de ${validacao.maxBlocos} blocos (usou ${validacao.totalBlocosWorkspace}).`)
    }
    if (validacao.usouBlocoNaoPermitido) avisos.push('Usou um bloco que não está liberado nesta atividade.')
    return {
      origem: 'servidor',
      status: validacao.status as StatusSimulacao,
      concluida: validacao.concluida,
      blocosUsados: validacao.blocosUsados,
      totalBlocosWorkspace: validacao.totalBlocosWorkspace,
      maxBlocos: validacao.maxBlocos,
      passosExecutados: validacao.passosExecutados,
      posicaoFinal: validacao.posicaoFinal,
      blocosSoltos: validacao.blocosSoltos,
      motivo: validacao.motivo,
      avisos,
    }
  }
  if (!simulacao) return null
  const { resultado } = simulacao
  return {
    origem: 'navegador',
    status: resultado.status,
    concluida: resultado.chegou,
    blocosUsados: resultado.blocosUsados,
    totalBlocosWorkspace: resultado.totalBlocosWorkspace,
    maxBlocos: cenario?.maxBlocos ?? null,
    passosExecutados: resultado.passosExecutados,
    posicaoFinal: resultado.posicaoFinal,
    blocosSoltos: resultado.blocosSoltos,
    motivo: null,
    avisos: [],
  }
}
