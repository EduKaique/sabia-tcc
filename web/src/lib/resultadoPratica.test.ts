import { describe, expect, it } from 'vitest'
import { resultadoPraticaRobo } from '@/lib/resultadoPratica'
import { simular } from '@/lib/simuladorRobo'
import { CENARIO_LIVRE_5X5 } from '@/lib/cenariosRobo'
import type { ResultadoValidacao } from '@/types'

const validacao = (extra: Partial<ResultadoValidacao> = {}): ResultadoValidacao => ({
  versaoValidador: 1,
  modo: 'JOGO_ROBO',
  concluida: true,
  status: 'CHEGOU',
  blocosUsados: 2,
  totalBlocosWorkspace: 2,
  maxBlocos: null,
  excedeuLimiteBlocos: false,
  usouBlocoNaoPermitido: false,
  passosExecutados: 8,
  blocosSoltos: 0,
  posicaoFinal: { linha: 0, coluna: 4 },
  motivo: null,
  ...extra,
})

const NAO_CHEGA = {
  blocks: { blocks: [{ type: 'robo_mover', fields: { DIRECAO: 'CIMA', CASAS: 1 } }] },
}

describe('resultadoPraticaRobo', () => {
  it('usa o resultado do servidor quando existe, mesmo que o navegador discorde', () => {
    const local = simular(CENARIO_LIVRE_5X5, NAO_CHEGA)
    const r = resultadoPraticaRobo(validacao(), local, CENARIO_LIVRE_5X5)

    expect(r?.origem).toBe('servidor')
    expect(r?.status).toBe('CHEGOU')
    expect(r?.concluida).toBe(true)
    expect(r?.avisos).toEqual([])
  })

  it('servidor: chegou mas excedeu o limite e usou bloco não permitido gera avisos e não conclui', () => {
    const r = resultadoPraticaRobo(
      validacao({
        concluida: false,
        maxBlocos: 2,
        totalBlocosWorkspace: 3,
        excedeuLimiteBlocos: true,
        usouBlocoNaoPermitido: true,
        motivo: 'Você usou um bloco que não está liberado nesta atividade.',
      }),
      null,
      null,
    )

    expect(r?.concluida).toBe(false)
    expect(r?.avisos).toEqual([
      'Passou do limite de 2 blocos (usou 3).',
      'Usou um bloco que não está liberado nesta atividade.',
    ])
    expect(r?.motivo).toContain('não está liberado')
  })

  it('entrega antiga (validação nula ou ausente) cai na simulação do navegador', () => {
    const local = simular(CENARIO_LIVRE_5X5, NAO_CHEGA)
    for (const v of [null, undefined]) {
      const r = resultadoPraticaRobo(v, local, { ...CENARIO_LIVRE_5X5, maxBlocos: 5 })
      expect(r?.origem).toBe('navegador')
      expect(r?.status).toBe('NAO_CHEGOU')
      expect(r?.concluida).toBe(false)
      expect(r?.maxBlocos).toBe(5)
      expect(r?.motivo).toBeNull()
    }
  })

  it('validação de blocos livres não serve para o painel do robô', () => {
    const local = simular(CENARIO_LIVRE_5X5, NAO_CHEGA)
    const r = resultadoPraticaRobo(validacao({ modo: 'BLOCOS', status: 'BLOCOS_LIVRES_OK' }), local, null)
    expect(r?.origem).toBe('navegador')
  })

  it('sem resultado do servidor nem simulação devolve null', () => {
    expect(resultadoPraticaRobo(null, null, null)).toBeNull()
  })
})
