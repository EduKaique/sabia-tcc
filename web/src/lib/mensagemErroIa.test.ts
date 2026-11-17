import { describe, expect, it } from 'vitest'
import { MENSAGEM_COTA_IA, mensagemErroIa } from './mensagemErroIa'

const GENERICA = 'Não foi possível gerar. Tente novamente.'

function erroAxios(status: number, data: unknown) {
  return { isAxiosError: true, response: { status, data } }
}

describe('mensagemErroIa', () => {
  it('503 com codigo COTA_IA_ESGOTADA devolve a mensagem de cota', () => {
    const err = erroAxios(503, { detail: { codigo: 'COTA_IA_ESGOTADA', mensagem: 'x' } })
    expect(mensagemErroIa(err, GENERICA)).toBe(MENSAGEM_COTA_IA)
  })

  it.each([
    ['503 sem codigo', erroAxios(503, { detail: 'Serviço de IA temporariamente indisponível.' })],
    ['503 com outro codigo', erroAxios(503, { detail: { codigo: 'OUTRO' } })],
    ['502 de resposta inválida', erroAxios(502, { detail: { codigo: 'IA_RESPOSTA_INVALIDA' } })],
    ['500 com o codigo de cota', erroAxios(500, { detail: { codigo: 'COTA_IA_ESGOTADA' } })],
    ['erro sem resposta', { isAxiosError: true, message: 'Network Error' }],
    ['erro comum', new Error('falhou')],
    ['valor nulo', null],
  ])('%s devolve a mensagem padrão', (_, err) => {
    expect(mensagemErroIa(err, GENERICA)).toBe(GENERICA)
  })
})
