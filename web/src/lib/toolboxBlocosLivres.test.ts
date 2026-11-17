import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { TIPOS_DINAMICOS_BLOCOS_LIVRES, toolboxBlocosLivres } from '@/lib/toolboxBlocosLivres'

/** Catálogo usado pelo servidor para decidir a conclusão em blocos livres (fixtures/blocos-livres). */
const ARQUIVO = fileURLToPath(new URL('../../../fixtures/blocos-livres/classificacao.json', import.meta.url))
const classificacao = JSON.parse(readFileSync(ARQUIVO, 'utf8')) as {
  comandos: string[]
  valores: string[]
  outros: string[]
}

function tiposDoToolbox(): string[] {
  const xml = toolboxBlocosLivres(() => '')
  const tipos = [...xml.matchAll(/type="([^"]+)"/g)].map((m) => m[1])
  return [...new Set([...tipos, ...TIPOS_DINAMICOS_BLOCOS_LIVRES])].sort()
}

describe('classificação dos blocos livres', () => {
  it('todo tipo do toolbox (e das categorias dinâmicas) está classificado', () => {
    const classificados = new Set([...classificacao.comandos, ...classificacao.valores, ...classificacao.outros])
    const faltando = tiposDoToolbox().filter((tipo) => !classificados.has(tipo))
    expect(faltando, 'classifique em fixtures/blocos-livres/classificacao.json').toEqual([])
  })

  it('nenhum tipo aparece em duas listas', () => {
    const todos = [...classificacao.comandos, ...classificacao.valores, ...classificacao.outros]
    expect(todos.length).toBe(new Set(todos).size)
  })

  it('o toolbox tem os blocos esperados (sanidade do extrator)', () => {
    const tipos = tiposDoToolbox()
    expect(tipos).toContain('text_print')
    expect(tipos).toContain('get_input')
    expect(tipos.length).toBeGreaterThan(40)
  })
})
