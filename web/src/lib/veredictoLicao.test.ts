import { describe, expect, it } from 'vitest'
import { veredictoConclusao } from '@/lib/veredictoLicao'
import type { ResultadoValidacao } from '@/types'
import type { ConclusaoAtividade } from '@/types/licao'

const validacao = (extra: Partial<ResultadoValidacao>): ResultadoValidacao => ({
  versaoValidador: 1,
  modo: 'JOGO_ROBO',
  concluida: false,
  status: 'NAO_CHEGOU',
  blocosUsados: 1,
  totalBlocosWorkspace: 1,
  maxBlocos: null,
  excedeuLimiteBlocos: false,
  usouBlocoNaoPermitido: false,
  passosExecutados: 1,
  blocosSoltos: 0,
  posicaoFinal: { linha: 3, coluna: 0 },
  motivo: 'O robô não chegou ao destino. Confira o caminho e tente de novo.',
  ...extra,
})

const resposta = (atividadeConcluida: boolean, v: ResultadoValidacao | null): ConclusaoAtividade => ({
  atividadeConcluida,
  concluida: false,
  concluidaEm: null,
  validacao: v,
})

describe('veredictoConclusao', () => {
  it('concluída: sem mensagem', () => {
    expect(veredictoConclusao(resposta(true, validacao({ concluida: true, status: 'CHEGOU', motivo: null })))).toEqual({
      concluida: true,
      mensagem: null,
    })
  })

  it('não concluída: mostra o motivo do servidor com tom amigável', () => {
    expect(veredictoConclusao(resposta(false, validacao({})))).toEqual({
      concluida: false,
      mensagem: 'Quase lá! O robô não chegou ao destino. Confira o caminho e tente de novo.',
    })
  })

  it('vale o servidor mesmo quando o navegador achou que chegou (ex.: limite de blocos)', () => {
    const v = validacao({
      status: 'CHEGOU',
      excedeuLimiteBlocos: true,
      motivo: 'Você usou 3 blocos, mas o limite desta atividade é 2.',
    })
    const r = veredictoConclusao(resposta(false, v))
    expect(r.concluida).toBe(false)
    expect(r.mensagem).toContain('limite desta atividade é 2')
  })

  it('sem motivo ou sem validação usa uma mensagem padrão', () => {
    expect(veredictoConclusao(resposta(false, null)).mensagem).toMatch(/^Quase lá! /)
    expect(veredictoConclusao(resposta(false, validacao({ motivo: null }))).mensagem).toMatch(/^Quase lá! /)
  })

  it('prática já concluída antes continua concluída (a regra do servidor nunca desfaz)', () => {
    expect(veredictoConclusao(resposta(true, validacao({}))).concluida).toBe(true)
  })
})
