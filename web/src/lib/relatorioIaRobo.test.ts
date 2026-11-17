import { describe, expect, it } from 'vitest'
import { CENARIO_OBSTACULOS_5X5 } from '@/lib/cenariosRobo'
import type { AnaliseRobo } from '@/types'
import {
  SEM_ANALISE_ROBO,
  SEM_CENARIO_ROBO,
  SEM_PROJETO_ROBO,
  montarPedidoRelatorioRobo,
  relatorioSemNota,
} from './relatorioIaRobo'

const ANALISE: AnaliseRobo = {
  status: 'CHEGOU',
  concluida: true,
  blocosUsados: 2,
  totalBlocosWorkspace: 2,
  maxBlocos: null,
  blocosSoltos: 0,
  excedeuLimiteBlocos: false,
  usouBlocoNaoPermitido: false,
  passosExecutados: 8,
  passosMinimos: 8,
  eficiencia: 1,
  quantidadeRepetir: 0,
  profundidadeMaxima: 0,
  maiorSequenciaIgual: 1,
  sequenciaRepetivel: false,
  distanciaAoDestino: 0,
  pseudocodigo: 'mover CIMA 4\nmover DIREITA 4',
  pseudocodigoTruncado: false,
}

const ATIVIDADE = {
  titulo: 'Robô no jardim',
  descricao: 'Leve o robô até a flor.',
  pontuacaoMaxima: 10,
  gabaritoEstadoJson: '',
  cenarioJson: JSON.stringify(CENARIO_OBSTACULOS_5X5),
}
const SUBMISSAO = { estadoJson: '{"blocks":{}}', analiseRobo: ANALISE }

describe('montarPedidoRelatorioRobo', () => {
  it('monta o pedido com o cenário, as métricas sem o pseudocódigo e o pseudocódigo à parte', () => {
    const r = montarPedidoRelatorioRobo(ATIVIDADE, SUBMISSAO)

    expect('payload' in r).toBe(true)
    if (!('payload' in r)) return
    expect(r.payload.atividade).toEqual({
      titulo: 'Robô no jardim',
      descricao: 'Leve o robô até a flor.',
      pontuacaoMaxima: 10,
      gabaritoEstadoJson: '',
    })
    expect(r.payload.submissaoEstadoJson).toBe('{"blocks":{}}')
    expect(r.payload.contextoRobo?.cenario).toEqual(CENARIO_OBSTACULOS_5X5)
    expect(r.payload.contextoRobo?.pseudocodigo).toBe(ANALISE.pseudocodigo)
    expect(r.payload.contextoRobo?.metricas).not.toHaveProperty('pseudocodigo')
    expect(r.payload.contextoRobo?.metricas).toMatchObject({ passosExecutados: 8, eficiencia: 1 })
  })

  it('sem análise do servidor fica indisponível em vez de chamar a IA', () => {
    expect(montarPedidoRelatorioRobo(ATIVIDADE, { ...SUBMISSAO, analiseRobo: null })).toEqual({
      indisponivel: SEM_ANALISE_ROBO,
    })
    expect(montarPedidoRelatorioRobo(ATIVIDADE, { estadoJson: '{}' })).toEqual({ indisponivel: SEM_ANALISE_ROBO })
  })

  it('sem projeto ou com cenário ilegível fica indisponível', () => {
    expect(montarPedidoRelatorioRobo(ATIVIDADE, { ...SUBMISSAO, estadoJson: null })).toEqual({
      indisponivel: SEM_PROJETO_ROBO,
    })
    expect(montarPedidoRelatorioRobo({ ...ATIVIDADE, cenarioJson: '{quebrado' }, SUBMISSAO)).toEqual({
      indisponivel: SEM_CENARIO_ROBO,
    })
  })
})

describe('relatorioSemNota', () => {
  it('remove a nota e mantém o resto', () => {
    expect(relatorioSemNota({ resumo: 'R', notaSugerida: 9, acertos: ['a'], erros: [] })).toEqual({
      resumo: 'R',
      acertos: ['a'],
      erros: [],
    })
  })

  it('resposta sem nota continua igual', () => {
    expect(relatorioSemNota({ resumo: 'R', acertos: [] })).toEqual({ resumo: 'R', acertos: [] })
  })
})
