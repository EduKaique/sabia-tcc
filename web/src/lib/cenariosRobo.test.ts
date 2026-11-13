import { describe, expect, it } from 'vitest'
import {
  CENARIO_LIVRE_5X5,
  CENARIO_OBSTACULOS_5X5,
  lerCenario,
  presetDoCenario,
} from '@/lib/cenariosRobo'

describe('lerCenario', () => {
  it('devolve null para ausente, JSON inválido ou formato inesperado', () => {
    expect(lerCenario(null)).toBeNull()
    expect(lerCenario(undefined)).toBeNull()
    expect(lerCenario('')).toBeNull()
    expect(lerCenario('{quebrado')).toBeNull()
    expect(lerCenario(JSON.stringify({ linhas: 5, colunas: 5 }))).toBeNull()
    expect(lerCenario(JSON.stringify({ ...CENARIO_LIVRE_5X5, inicio: { linha: 'a', coluna: 0 } }))).toBeNull()
  })

  it('lê um cenário válido', () => {
    expect(lerCenario(JSON.stringify(CENARIO_OBSTACULOS_5X5))).toEqual(CENARIO_OBSTACULOS_5X5)
  })
})

describe('presetDoCenario', () => {
  it('reconhece o preset pelo conteúdo, ignorando a ordem das chaves e o maxBlocos', () => {
    const reordenado = Object.fromEntries(Object.entries(CENARIO_LIVRE_5X5).reverse()) as typeof CENARIO_LIVRE_5X5
    expect(presetDoCenario(reordenado)).toBe('livre-5x5')
    expect(presetDoCenario({ ...CENARIO_OBSTACULOS_5X5, maxBlocos: 3 })).toBe('obstaculos-5x5')
  })

  it('devolve null para um cenário que não é preset', () => {
    expect(presetDoCenario({ ...CENARIO_LIVRE_5X5, destino: { linha: 1, coluna: 1 } })).toBeNull()
  })
})
