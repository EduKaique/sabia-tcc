// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { perguntaVazia, type ConteudoQuestionarioEditor } from '@/lib/licoes/questionario'
import { AVISO_QUESTIONARIO, FormPaginaQuestionario } from './FormPaginaQuestionario'

afterEach(cleanup)

function Questionario({ erros = {} }: { erros?: Record<string, string> }) {
  const [c, setC] = useState<ConteudoQuestionarioEditor>({ percentualMinimo: 70, perguntas: [perguntaVazia()] })
  return (
    <>
      <FormPaginaQuestionario idBase="q" conteudo={c} onChange={(p) => setC((a) => ({ ...a, ...p }))} erros={erros} />
      <output data-testid="estado">{JSON.stringify(c)}</output>
    </>
  )
}

const estado = () => JSON.parse(screen.getByTestId('estado').textContent ?? '{}') as ConteudoQuestionarioEditor
const perguntas = () => within(screen.getByRole('list', { name: 'Perguntas' })).getAllByRole('listitem')
const botao = (nome: string | RegExp) => screen.getByRole('button', { name: nome }) as HTMLButtonElement

describe('FormPaginaQuestionario', () => {
  it('mostra o aviso fixo e o percentual padrão', () => {
    render(<Questionario />)
    expect(screen.getByText(AVISO_QUESTIONARIO)).toBeTruthy()
    expect((screen.getByLabelText('Percentual mínimo de acertos') as HTMLInputElement).value).toBe('70')
  })

  it('adiciona e remove perguntas nos limites (1 a 10)', () => {
    render(<Questionario />)
    expect(botao('Remover pergunta 1').disabled).toBe(true)
    for (let i = 0; i < 9; i++) fireEvent.click(botao('Adicionar pergunta'))
    expect(perguntas()).toHaveLength(10)
    expect(botao('Adicionar pergunta').disabled).toBe(true)
    expect(screen.getByText('Limite de 10 perguntas atingido.')).toBeTruthy()

    fireEvent.click(botao('Remover pergunta 3'))
    expect(perguntas()).toHaveLength(9)
    expect(botao('Adicionar pergunta').disabled).toBe(false)
  })

  it('adiciona e remove alternativas nos limites (2 a 5)', () => {
    render(<Questionario />)
    const adicionar = () => within(perguntas()[0]).getByRole('button', { name: 'Adicionar alternativa' }) as HTMLButtonElement
    expect(botao('Remover alternativa 1 da pergunta 1').disabled).toBe(true)
    fireEvent.click(adicionar())
    fireEvent.click(adicionar())
    fireEvent.click(adicionar())
    expect(screen.getAllByLabelText('Marcar como resposta certa')).toHaveLength(5)
    expect(adicionar().disabled).toBe(true)

    fireEvent.click(botao('Remover alternativa 2 da pergunta 1'))
    expect(screen.getAllByLabelText('Marcar como resposta certa')).toHaveLength(4)
    expect(adicionar().disabled).toBe(false)
  })

  it('marca a certa e, ao remover a alternativa certa, fica sem certa', () => {
    render(<Questionario />)
    fireEvent.click(within(perguntas()[0]).getByRole('button', { name: 'Adicionar alternativa' }))
    fireEvent.change(screen.getByLabelText('Alternativa 1 da pergunta 1'), { target: { value: 'A' } })
    fireEvent.change(screen.getByLabelText('Alternativa 3 da pergunta 1'), { target: { value: 'C' } })
    const radios = () => screen.getAllByLabelText('Marcar como resposta certa') as HTMLInputElement[]

    fireEvent.click(radios()[2])
    expect(radios()[2].checked).toBe(true)
    expect(estado().perguntas[0].correta).toBe(2)

    // Remover uma anterior: a certa desce junto.
    fireEvent.click(botao('Remover alternativa 1 da pergunta 1'))
    expect(estado().perguntas[0]).toMatchObject({ alternativas: ['', 'C'], correta: 1 })
    expect(radios()[1].checked).toBe(true)

    fireEvent.click(within(perguntas()[0]).getByRole('button', { name: 'Adicionar alternativa' }))
    fireEvent.click(botao('Remover alternativa 2 da pergunta 1'))
    expect(estado().perguntas[0].correta).toBeNull()
    expect(radios().some((r) => r.checked)).toBe(false)
  })

  it('move perguntas para cima e para baixo', () => {
    render(<Questionario />)
    fireEvent.click(botao('Adicionar pergunta'))
    fireEvent.change(screen.getByLabelText(/Enunciado/, { selector: '#q-p0-enunciado' }), { target: { value: 'Primeira' } })
    expect(botao('Mover pergunta 1 para cima').disabled).toBe(true)
    expect(botao('Mover pergunta 2 para baixo').disabled).toBe(true)
    fireEvent.click(botao('Mover pergunta 1 para baixo'))
    expect(estado().perguntas.map((p) => p.enunciado)).toEqual(['', 'Primeira'])
  })

  it('mostra os erros junto dos campos pelas chaves do servidor', () => {
    render(
      <Questionario
        erros={{
          percentualMinimo: 'O percentual mínimo deve ficar entre 0 e 100.',
          'perguntas[0].enunciado': 'Escreva a pergunta.',
          'perguntas[0].alternativas[1]': 'A alternativa não pode ficar vazia.',
          'perguntas[0].correta': 'Escolha a alternativa certa.',
        }}
      />
    )
    expect(screen.getByText('O percentual mínimo deve ficar entre 0 e 100.')).toBeTruthy()
    expect(within(perguntas()[0]).getByText('Escreva a pergunta.')).toBeTruthy()
    expect(within(perguntas()[0]).getByText('A alternativa não pode ficar vazia.')).toBeTruthy()
    expect(within(perguntas()[0]).getByText('Escolha a alternativa certa.')).toBeTruthy()
    expect(screen.getByLabelText('Alternativa 2 da pergunta 1').getAttribute('aria-invalid')).toBe('true')
  })
})
