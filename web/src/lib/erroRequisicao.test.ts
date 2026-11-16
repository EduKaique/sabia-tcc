import { describe, expect, it } from 'vitest'
import { ErroRequisicao, erroDaResposta, erroDeRede } from '@/lib/erroRequisicao'

describe('erroDaResposta', () => {
  it('usa o status e o erro do corpo (ex.: 429 do limite de tentativas)', async () => {
    const corpo = { status: 429, erro: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.', timestamp: '' }
    const erro = await erroDaResposta(new Response(JSON.stringify(corpo), { status: 429 }))

    expect(erro).toBeInstanceOf(ErroRequisicao)
    expect(erro.status).toBe(429)
    expect(erro.message).toBe(corpo.erro)
  })

  it('repassa os campos de validação', async () => {
    const corpo = { status: 400, erro: 'Dados inválidos', timestamp: '', campos: { senha: 'Curta' } }
    const erro = await erroDaResposta(new Response(JSON.stringify(corpo), { status: 400 }))

    expect(erro.campos).toEqual({ senha: 'Curta' })
  })

  it('cai em SERVER_ERROR quando o corpo não é JSON', async () => {
    const erro = await erroDaResposta(new Response('<html>Bad Gateway</html>', { status: 502 }))

    expect(erro.status).toBe(502)
    expect(erro.message).toBe('SERVER_ERROR')
  })
})

describe('erroDeRede', () => {
  it('tem status 0 e mensagem NETWORK_ERROR', () => {
    const erro = erroDeRede()
    expect(erro.status).toBe(0)
    expect(erro.message).toBe('NETWORK_ERROR')
  })
})
