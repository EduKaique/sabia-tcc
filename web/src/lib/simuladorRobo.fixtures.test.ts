import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { simular } from '@/lib/simuladorRobo'
import type { CenarioRobo } from '@/types'

/**
 * Casos compartilhados com o simulador Java do pedagógico (fixtures/robo na raiz do repositório).
 * O contrato está em fixtures/robo/README.md; cada caso compara só as chaves presentes em "esperado".
 */
const PASTA = fileURLToPath(new URL('../../../fixtures/robo/', import.meta.url))

interface CasoRobo {
  nome: string
  cenario: CenarioRobo
  estado: object | string
  esperado: Record<string, unknown>
}

const casos: CasoRobo[] = readdirSync(PASTA)
  .filter((arquivo) => arquivo.endsWith('.json'))
  .sort()
  .map((arquivo) => JSON.parse(readFileSync(PASTA + arquivo, 'utf8')))

describe('fixtures do simulador do robô', () => {
  it('encontra os casos compartilhados', () => {
    expect(casos.length).toBeGreaterThan(0)
  })

  it.each(casos.map((caso) => [caso.nome, caso] as const))('%s', (_nome, caso) => {
    const { resultado } = simular(caso.cenario, caso.estado)
    const obtido: Record<string, unknown> = { ...resultado }
    for (const [chave, valor] of Object.entries(caso.esperado)) {
      expect(obtido[chave], chave).toEqual(valor)
    }
  })
})
