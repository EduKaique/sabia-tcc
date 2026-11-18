import { describe, expect, it } from 'vitest'
import { perfilSchema } from '@/lib/schemas/perfilSchema'

function erros(dados: Record<string, unknown>) {
  const resultado = perfilSchema.safeParse(dados)
  return resultado.success ? {} : resultado.error.flatten().fieldErrors
}

describe('perfilSchema', () => {
  it('aceita nome com 3 e com 255 caracteres', () => {
    expect(perfilSchema.safeParse({ nome: 'Ana' }).success).toBe(true)
    expect(perfilSchema.safeParse({ nome: 'a'.repeat(255) }).success).toBe(true)
  })

  it('remove espaços nas pontas do nome', () => {
    const resultado = perfilSchema.safeParse({ nome: '  Ana Souza  ' })
    expect(resultado.success && resultado.data.nome).toBe('Ana Souza')
  })

  it('recusa nome vazio ou só com espaços', () => {
    expect(erros({ nome: '' }).nome).toEqual(['O nome deve ter entre 3 e 255 caracteres.'])
    expect(erros({ nome: '   ' }).nome).toEqual(['O nome deve ter entre 3 e 255 caracteres.'])
  })

  it('recusa nome com 2 ou com 256 caracteres', () => {
    expect(erros({ nome: 'An' }).nome).toEqual(['O nome deve ter entre 3 e 255 caracteres.'])
    expect(erros({ nome: 'a'.repeat(256) }).nome).toEqual(['O nome deve ter entre 3 e 255 caracteres.'])
  })

  it('aceita avatar do catálogo ou ausente (professor)', () => {
    expect(perfilSchema.safeParse({ nome: 'Ana', avatar: 'sabia-roxo' }).success).toBe(true)
    expect(perfilSchema.safeParse({ nome: 'Ana' }).success).toBe(true)
  })

  it('recusa avatar fora do catálogo', () => {
    expect(erros({ nome: 'Ana', avatar: 'avatar-1.png' }).avatar).toEqual(['Avatar inválido.'])
  })
})
