import { describe, expect, it } from 'vitest'
import { LIMITE_PASSOS, simular } from '@/lib/simuladorRobo'
import { CENARIO_LIVRE_5X5, CENARIO_OBSTACULOS_5X5 } from '@/lib/cenariosRobo'

type Bloco = {
  type: string
  id?: string
  fields?: Record<string, unknown>
  inputs?: Record<string, { block?: Bloco }>
  next?: { block?: Bloco }
}

const mover = (direcao: string, casas = 1, proximo?: Bloco): Bloco => ({
  type: 'robo_mover',
  id: `${direcao}-${casas}`,
  fields: { DIRECAO: direcao, CASAS: casas },
  next: proximo ? { block: proximo } : undefined,
})

const repetir = (vezes: number, corpo: Bloco): Bloco => ({
  type: 'robo_repetir',
  fields: { VEZES: vezes },
  inputs: { FAZER: { block: corpo } },
})

/** Estado no formato de Blockly.serialization.workspaces.save. */
const workspace = (...topo: Bloco[]) => ({ blocks: { languageVersion: 0, blocks: topo } })

describe('simular', () => {
  it('CHEGOU: 4 para cima e 4 para a direita no cenário livre', () => {
    const { resultado, passos } = simular(CENARIO_LIVRE_5X5, workspace(mover('CIMA', 4, mover('DIREITA', 4))))

    expect(resultado.status).toBe('CHEGOU')
    expect(resultado.chegou).toBe(true)
    expect(resultado.posicaoFinal).toEqual({ linha: 0, coluna: 4 })
    expect(resultado.blocosUsados).toBe(2)
    expect(passos).toHaveLength(8)
  })

  it('NAO_CHEGOU: termina dentro da grade fora do destino', () => {
    const { resultado } = simular(CENARIO_LIVRE_5X5, workspace(mover('CIMA', 1)))
    expect(resultado.status).toBe('NAO_CHEGOU')
  })

  it('COLIDIU: bate no obstáculo e para na última casa válida', () => {
    const { resultado, passos } = simular(CENARIO_OBSTACULOS_5X5, workspace(mover('CIMA', 4)))

    expect(resultado.status).toBe('COLIDIU')
    expect(resultado.posicaoFinal).toEqual({ linha: 3, coluna: 0 })
    expect(passos.at(-1)?.ok).toBe(false)
  })

  it('SAIU_DO_GRID: anda para fora da grade', () => {
    const { resultado } = simular(CENARIO_LIVRE_5X5, workspace(mover('ESQUERDA', 1)))
    expect(resultado.status).toBe('SAIU_DO_GRID')
  })

  it('SEM_BLOCOS: workspace vazio, JSON inválido ou só blocos que não são do robô', () => {
    expect(simular(CENARIO_LIVRE_5X5, workspace()).resultado.status).toBe('SEM_BLOCOS')
    expect(simular(CENARIO_LIVRE_5X5, '{isto não é json').resultado.status).toBe('SEM_BLOCOS')
    expect(simular(CENARIO_LIVRE_5X5, {}).resultado.status).toBe('SEM_BLOCOS')
    expect(simular(CENARIO_LIVRE_5X5, workspace({ type: 'text_print' })).resultado.status).toBe('SEM_BLOCOS')
  })

  it('aceita o estado como string JSON', () => {
    const estado = JSON.stringify(workspace(mover('CIMA', 4, mover('DIREITA', 4))))
    expect(simular(CENARIO_LIVRE_5X5, estado).resultado.status).toBe('CHEGOU')
  })

  it('LIMITE_EXCEDIDO: laços aninhados passam de LIMITE_PASSOS', () => {
    const vaiEVolta = mover('DIREITA', 1, mover('ESQUERDA', 1))
    const { resultado, passos } = simular(
      CENARIO_LIVRE_5X5,
      workspace(repetir(10, repetir(10, repetir(10, vaiEVolta)))),
    )

    expect(resultado.status).toBe('LIMITE_EXCEDIDO')
    expect(passos).toHaveLength(LIMITE_PASSOS)
  })

  it('conta blocos soltos fora da pilha principal', () => {
    const principal = { ...mover('CIMA', 4, mover('DIREITA', 4)), x: 0, y: 0 }
    const solto = { ...mover('BAIXO', 1), x: 0, y: 200 }
    const { resultado } = simular(CENARIO_LIVRE_5X5, workspace(principal, solto))

    expect(resultado.status).toBe('CHEGOU')
    expect(resultado.blocosSoltos).toBe(1)
  })
})
