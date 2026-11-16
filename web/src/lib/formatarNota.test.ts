import { describe, expect, it } from 'vitest'
import { formatarNota, formatarNumero, formatarPontos } from '@/lib/formatarNota'

describe('formatarNumero', () => {
  it('usa vírgula e no máximo 2 casas', () => {
    expect(formatarNumero(8.5)).toBe('8,5')
    expect(formatarNumero(7.25)).toBe('7,25')
    expect(formatarNumero(6.666)).toBe('6,67')
  })

  it('não mostra casas em números inteiros', () => {
    expect(formatarNumero(10)).toBe('10')
  })
})

describe('formatarNota', () => {
  it('mostra a nota sobre o máximo', () => {
    expect(formatarNota(8.5, 10)).toBe('8,5 / 10')
    expect(formatarNota(0, 10)).toBe('0 / 10')
  })

  it('devolve null quando não há nota', () => {
    expect(formatarNota(null, 10)).toBeNull()
    expect(formatarNota(undefined, 10)).toBeNull()
  })
})

describe('formatarPontos', () => {
  it('usa singular para 1 ponto e plural nos demais', () => {
    expect(formatarPontos(1)).toBe('Vale 1 ponto')
    expect(formatarPontos(10)).toBe('Vale 10 pontos')
  })
})
