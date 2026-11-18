import { describe, expect, it } from 'vitest'
import { criarCorrecaoSchema } from '@/lib/schemas/correcaoSchema'

const schema = criarCorrecaoSchema(10)

function erroNota(nota: unknown) {
  const resultado = schema.safeParse({ nota, feedbackProfessor: 'Bom trabalho.' })
  return resultado.success ? undefined : resultado.error.flatten().fieldErrors.nota
}

describe('criarCorrecaoSchema', () => {
  it('aceita nota no limite da atividade e zero', () => {
    expect(erroNota('10')).toBeUndefined()
    expect(erroNota('0')).toBeUndefined()
    expect(erroNota('8.55')).toBeUndefined()
  })

  it('recusa nota acima da pontuação máxima da atividade', () => {
    expect(erroNota('10.01')).toEqual(['A nota máxima desta atividade é 10.'])
  })

  it('recusa nota negativa', () => {
    expect(erroNota('-1')).toContain('A nota mínima é 0.')
  })

  it('exige a nota', () => {
    expect(erroNota('')).toEqual(['Informe a nota.'])
  })

  it('recusa mais de 2 casas decimais', () => {
    expect(erroNota('8.555')).toEqual(['Use no máximo 2 casas decimais.'])
  })

  it('usa o máximo de cada atividade na mensagem', () => {
    const resultado = criarCorrecaoSchema(100).safeParse({ nota: '100.5', feedbackProfessor: 'ok' })
    expect(resultado.success).toBe(false)
    expect(resultado.success ? undefined : resultado.error.flatten().fieldErrors.nota).toEqual([
      'A nota máxima desta atividade é 100.',
    ])
  })
})
