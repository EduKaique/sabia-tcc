import { describe, expect, it } from 'vitest'
import { CENARIO_OBSTACULOS_5X5 } from '@/lib/cenariosRobo'
import {
  MENSAGEM_SEM_CENARIO,
  NOME_CENARIO_SUGERIDO,
  PARAMETROS_CENARIO_PADRAO,
  cenarioRecebidoValido,
  montarPedidoRobo,
  nomePadraoCenario,
  valorInicialEditor,
} from './assistenteRoboIa'

describe('montarPedidoRobo', () => {
  it('com cenário resolvido envia o cenário e não pede sugestão', () => {
    const r = montarPedidoRobo({
      idTurma: 3,
      descricaoObjetivo: '  desviar de obstáculos  ',
      cenario: CENARIO_OBSTACULOS_5X5,
      sugerirCenario: false,
    })
    expect(r).toEqual({
      pedido: {
        idTurma: 3,
        descricaoObjetivo: 'desviar de obstáculos',
        sugerirCenario: false,
        cenario: CENARIO_OBSTACULOS_5X5,
      },
    })
  })

  it('sem cenário e sem sugestão devolve erro', () => {
    const r = montarPedidoRobo({ descricaoObjetivo: 'x', cenario: null, sugerirCenario: false })
    expect(r).toEqual({ erro: MENSAGEM_SEM_CENARIO })
  })

  it('com sugestão usa os parâmetros padrão quando ausentes e não envia cenário', () => {
    const r = montarPedidoRobo({
      idTurma: null,
      descricaoObjetivo: 'x',
      cenario: CENARIO_OBSTACULOS_5X5,
      sugerirCenario: true,
    })
    expect(r).toEqual({
      pedido: { descricaoObjetivo: 'x', sugerirCenario: true, parametrosCenario: PARAMETROS_CENARIO_PADRAO },
    })
  })

  it('com sugestão envia os parâmetros informados', () => {
    const parametros = { linhas: 8, colunas: 6, dificuldade: 'DIFICIL' as const, usarRepetir: true }
    const r = montarPedidoRobo({ descricaoObjetivo: 'x', cenario: null, sugerirCenario: true, parametros })
    expect(r).toMatchObject({ pedido: { parametrosCenario: parametros } })
  })
})

describe('nomePadraoCenario', () => {
  it('trunca o título em 100 caracteres', () => {
    expect(nomePadraoCenario('a'.repeat(150))).toBe('a'.repeat(100))
  })

  it('usa o título sem espaços nas pontas', () => {
    expect(nomePadraoCenario('  Robô no jardim  ')).toBe('Robô no jardim')
  })

  it('usa um nome padrão quando o título é curto demais', () => {
    expect(nomePadraoCenario(' a ')).toBe(NOME_CENARIO_SUGERIDO)
  })
})

describe('cenarioRecebidoValido', () => {
  it('aceita um cenário bem formado', () => {
    expect(cenarioRecebidoValido(CENARIO_OBSTACULOS_5X5)).toEqual(CENARIO_OBSTACULOS_5X5)
  })

  it.each([
    ['ausente', undefined],
    ['texto', 'cenario'],
    ['grade grande', { ...CENARIO_OBSTACULOS_5X5, linhas: 12 }],
    ['início igual ao destino', { ...CENARIO_OBSTACULOS_5X5, destino: CENARIO_OBSTACULOS_5X5.inicio }],
    ['sem blocos', { ...CENARIO_OBSTACULOS_5X5, blocosPermitidos: [] }],
    ['posição não inteira', { ...CENARIO_OBSTACULOS_5X5, inicio: { linha: 1.5, coluna: 0 } }],
  ])('recusa cenário %s', (_, cenario) => {
    expect(cenarioRecebidoValido(cenario)).toBeNull()
  })
})

describe('valorInicialEditor', () => {
  it('converte a resposta com cenário para o valor inicial do editor', () => {
    expect(
      valorInicialEditor({ titulo: 'Robô no jardim', descricao: 'D', cenario: CENARIO_OBSTACULOS_5X5 }),
    ).toEqual({ nome: 'Robô no jardim', cenario: CENARIO_OBSTACULOS_5X5 })
  })

  it('resposta sem cenário devolve null', () => {
    expect(valorInicialEditor({ titulo: 'T', descricao: 'D' })).toBeNull()
  })
})
