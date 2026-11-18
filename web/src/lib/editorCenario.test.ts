import { describe, expect, it } from 'vitest'
import type { CenarioRobo } from '@/types'
import {
  aplicarFerramenta,
  criarCenarioVazio,
  montarCenario,
  redimensionar,
  validarFormaCenario,
} from '@/lib/editorCenario'

const base = (): CenarioRobo => criarCenarioVazio(5, 5)

describe('criarCenarioVazio', () => {
  it('põe início e destino em cantos opostos, sem obstáculos e com os dois blocos', () => {
    expect(criarCenarioVazio(4, 6)).toEqual({
      versao: 1,
      linhas: 4,
      colunas: 6,
      inicio: { linha: 3, coluna: 0 },
      destino: { linha: 0, coluna: 5 },
      obstaculos: [],
      blocosPermitidos: ['robo_mover', 'robo_repetir'],
    })
  })

  it('limita a grade entre 3 e 10', () => {
    const c = criarCenarioVazio(1, 20)
    expect([c.linhas, c.colunas]).toEqual([3, 10])
  })
})

describe('aplicarFerramenta', () => {
  it('obstáculo alterna numa casa vazia', () => {
    const com = aplicarFerramenta(base(), 'obstaculo', { linha: 2, coluna: 2 })
    expect(com.obstaculos).toEqual([{ linha: 2, coluna: 2 }])
    expect(aplicarFerramenta(com, 'obstaculo', { linha: 2, coluna: 2 }).obstaculos).toEqual([])
  })

  it('obstáculo não cobre início nem destino', () => {
    const c = base()
    expect(aplicarFerramenta(c, 'obstaculo', c.inicio)).toBe(c)
    expect(aplicarFerramenta(c, 'obstaculo', c.destino)).toBe(c)
  })

  it('mover o início ou o destino remove o obstáculo da casa', () => {
    const com = aplicarFerramenta(base(), 'obstaculo', { linha: 2, coluna: 2 })
    const inicio = aplicarFerramenta(com, 'inicio', { linha: 2, coluna: 2 })
    expect(inicio.inicio).toEqual({ linha: 2, coluna: 2 })
    expect(inicio.obstaculos).toEqual([])
    const destino = aplicarFerramenta(com, 'destino', { linha: 2, coluna: 2 })
    expect(destino.destino).toEqual({ linha: 2, coluna: 2 })
    expect(destino.obstaculos).toEqual([])
  })

  it('início e destino nunca coincidem', () => {
    const c = base()
    expect(aplicarFerramenta(c, 'inicio', c.destino)).toBe(c)
    expect(aplicarFerramenta(c, 'destino', c.inicio)).toBe(c)
  })

  it('apagar remove só obstáculo', () => {
    const com = aplicarFerramenta(base(), 'obstaculo', { linha: 1, coluna: 1 })
    expect(aplicarFerramenta(com, 'apagar', { linha: 1, coluna: 1 }).obstaculos).toEqual([])
    const c = base()
    const apagado = aplicarFerramenta(c, 'apagar', c.inicio)
    expect(apagado.inicio).toEqual(c.inicio)
  })

  it('ignora casa fora da grade', () => {
    const c = base()
    expect(aplicarFerramenta(c, 'obstaculo', { linha: 5, coluna: 0 })).toBe(c)
  })

  it('não altera o cenário recebido', () => {
    const c = base()
    aplicarFerramenta(c, 'obstaculo', { linha: 2, coluna: 2 })
    expect(c.obstaculos).toEqual([])
  })
})

describe('redimensionar', () => {
  it('descarta obstáculos fora da nova grade', () => {
    let c = aplicarFerramenta(base(), 'obstaculo', { linha: 1, coluna: 1 })
    c = aplicarFerramenta(c, 'obstaculo', { linha: 3, coluna: 3 })
    expect(redimensionar(c, 3, 3).obstaculos).toEqual([{ linha: 1, coluna: 1 }])
  })

  it('traz início e destino para dentro da grade', () => {
    // 5x5: início (4,0), destino (0,4) -> 3x3: (2,0) e (0,2).
    const r = redimensionar(base(), 3, 3)
    expect(r.inicio).toEqual({ linha: 2, coluna: 0 })
    expect(r.destino).toEqual({ linha: 0, coluna: 2 })
  })

  it('separa início e destino que caem na mesma casa', () => {
    // início (4,4) e destino (2,2) caem ambos em (2,2) numa grade 3x3.
    const c = { ...base(), inicio: { linha: 4, coluna: 4 }, destino: { linha: 2, coluna: 2 } }
    const r = redimensionar(c, 3, 3)
    expect(r.inicio).toEqual({ linha: 2, coluna: 2 })
    expect(r.destino).toEqual({ linha: 0, coluna: 2 })
  })

  it('remove obstáculo onde o início ou o destino foram parar', () => {
    const c = { ...base(), obstaculos: [{ linha: 2, coluna: 0 }, { linha: 0, coluna: 2 }] }
    expect(redimensionar(c, 3, 3).obstaculos).toEqual([])
  })

  it('aumentar mantém tudo no lugar', () => {
    const c = aplicarFerramenta(base(), 'obstaculo', { linha: 1, coluna: 1 })
    const r = redimensionar(c, 8, 10)
    expect([r.linhas, r.colunas]).toEqual([8, 10])
    expect(r.inicio).toEqual(c.inicio)
    expect(r.destino).toEqual(c.destino)
    expect(r.obstaculos).toEqual(c.obstaculos)
  })
})

describe('montarCenario', () => {
  it('monta o JSON final com versão 1 e blocos na ordem padrão', () => {
    const c = aplicarFerramenta(base(), 'obstaculo', { linha: 1, coluna: 1 })
    expect(montarCenario(c, ['robo_repetir', 'robo_mover'])).toEqual({
      versao: 1,
      linhas: 5,
      colunas: 5,
      inicio: { linha: 4, coluna: 0 },
      destino: { linha: 0, coluna: 4 },
      obstaculos: [{ linha: 1, coluna: 1 }],
      blocosPermitidos: ['robo_mover', 'robo_repetir'],
    })
  })

  it('inclui maxBlocos só se for inteiro >= 1', () => {
    expect(montarCenario(base(), ['robo_mover'], 6).maxBlocos).toBe(6)
    expect(montarCenario(base(), ['robo_mover'], 0)).not.toHaveProperty('maxBlocos')
    expect(montarCenario(base(), ['robo_mover'], 2.5)).not.toHaveProperty('maxBlocos')
    expect(montarCenario(base(), ['robo_mover'], null)).not.toHaveProperty('maxBlocos')
  })
})

describe('validarFormaCenario', () => {
  it('aceita um cenário bem formado', () => {
    expect(validarFormaCenario(base())).toBeNull()
  })

  it('recusa grade fora de 3 a 10, início igual ao destino e nenhum bloco', () => {
    expect(validarFormaCenario({ ...base(), linhas: 2 })).not.toBeNull()
    expect(validarFormaCenario({ ...base(), colunas: 11 })).not.toBeNull()
    expect(validarFormaCenario({ ...base(), destino: { linha: 4, coluna: 0 } })).not.toBeNull()
    expect(validarFormaCenario({ ...base(), blocosPermitidos: [] })).not.toBeNull()
  })
})
