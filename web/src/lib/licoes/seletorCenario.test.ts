import { describe, expect, it } from 'vitest'
import { CENARIO_LIVRE_5X5, CENARIO_OBSTACULOS_5X5 } from '@/lib/cenariosRobo'
import type { CenarioRobo } from '@/types'
import { OPCAO_ATUAL, lerLimite, montarCenarioJson, opcaoInicial, resolverOpcao } from './seletorCenario'

const PROPRIO: CenarioRobo = { ...CENARIO_LIVRE_5X5, destino: { linha: 0, coluna: 2 } }
const salvos = [{ id: 7, cenarioJson: JSON.stringify({ ...PROPRIO, maxBlocos: 4 }) }]

describe('seletorCenario', () => {
  it('opção inicial: preset, cenário salvo, atual ou nenhuma', () => {
    expect(opcaoInicial(null, salvos)).toBeUndefined()
    expect(opcaoInicial(JSON.stringify({ ...CENARIO_LIVRE_5X5, maxBlocos: 3 }), salvos)).toBe('livre-5x5')
    expect(opcaoInicial(JSON.stringify(PROPRIO), salvos)).toBe('salvo:7')
    expect(opcaoInicial(JSON.stringify(PROPRIO), [])).toBe(OPCAO_ATUAL)
  })

  it('resolve cada opção no seu cenário', () => {
    expect(resolverOpcao('obstaculos-5x5', null, [])).toEqual(CENARIO_OBSTACULOS_5X5)
    expect(resolverOpcao('salvo:7', null, salvos)).toEqual({ ...PROPRIO, maxBlocos: 4 })
    expect(resolverOpcao('salvo:99', null, salvos)).toBeNull()
    expect(resolverOpcao(OPCAO_ATUAL, PROPRIO, [])).toBe(PROPRIO)
    expect(resolverOpcao(undefined, PROPRIO, [])).toBeNull()
  })

  it('limite de blocos aplicado, trocado e removido no snapshot', () => {
    const comLimite = { ...PROPRIO, maxBlocos: 4 }
    expect(JSON.parse(montarCenarioJson(comLimite, 6)).maxBlocos).toBe(6)
    expect(JSON.parse(montarCenarioJson(comLimite, undefined))).not.toHaveProperty('maxBlocos')
    expect(JSON.parse(montarCenarioJson(CENARIO_LIVRE_5X5, 2))).toEqual({ ...CENARIO_LIVRE_5X5, maxBlocos: 2 })
  })

  it('lerLimite: vazio sem limite, inteiro >= 1, o resto inválido', () => {
    expect(lerLimite('')).toBeUndefined()
    expect(lerLimite(' 5 ')).toBe(5)
    expect(lerLimite('0')).toBeNull()
    expect(lerLimite('2.5')).toBeNull()
    expect(lerLimite('-1')).toBeNull()
  })
})
