import { describe, expect, it } from 'vitest'
import { trocarSenhaSchema } from '@/lib/schemas/trocarSenhaSchema'

const valido = { senhaAtual: 'atual123', novaSenha: 'nova-senha', confirmarSenha: 'nova-senha' }

function erros(dados: Record<string, string>) {
  const resultado = trocarSenhaSchema.safeParse(dados)
  return resultado.success ? {} : resultado.error.flatten().fieldErrors
}

describe('trocarSenhaSchema', () => {
  it('aceita senhas válidas e iguais', () => {
    expect(trocarSenhaSchema.safeParse(valido).success).toBe(true)
  })

  it('exige pelo menos 8 caracteres na nova senha', () => {
    expect(erros({ ...valido, novaSenha: '1234567', confirmarSenha: '1234567' }).novaSenha).toEqual([
      'A nova senha deve ter pelo menos 8 caracteres.',
    ])
  })

  it('aponta a confirmação divergente no campo confirmarSenha', () => {
    expect(erros({ ...valido, confirmarSenha: 'outra-senha' }).confirmarSenha).toEqual([
      'As senhas não coincidem.',
    ])
  })

  it('exige a senha atual', () => {
    expect(erros({ ...valido, senhaAtual: '' }).senhaAtual).toEqual(['Digite sua senha atual.'])
  })
})
