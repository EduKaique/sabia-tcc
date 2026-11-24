// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ConteudoQuestionarioAluno, CorrecaoQuestionario } from '@/types/licao'
import { QuestionarioAluno } from './QuestionarioAluno'

// next/font só funciona no build do Next; no teste basta uma classe vazia.
vi.mock('@/lib/fontesHome', () => ({ fredoka: { className: '' } }))

afterEach(cleanup)

const CONTEUDO: ConteudoQuestionarioAluno = {
  percentualMinimo: 70,
  perguntas: [
    { enunciado: 'Quantas vezes o laço repete?', alternativas: ['Uma', 'Quantas mandarmos'] },
    { enunciado: 'Qual bloco repete?', alternativas: ['Repita', 'Se', 'Mover'] },
  ],
}

const correcao = (certas: boolean[], extra: Partial<CorrecaoQuestionario> = {}): CorrecaoQuestionario => {
  const acertos = certas.filter(Boolean).length
  const percentual = Math.floor((acertos * 100) / certas.length)
  return {
    paginaId: 9,
    acertos,
    total: certas.length,
    percentual,
    aprovado: percentual >= 70,
    aprovadoNaPagina: percentual >= 70,
    melhorPercentual: percentual,
    tentativas: 1,
    perguntas: certas.map((certa) => ({ certa })),
    praticaLiberada: false,
    ...extra,
  }
}

const enviarBotao = () => screen.getByRole('button', { name: 'Enviar respostas' }) as HTMLButtonElement
const marcar = (texto: string) => fireEvent.click(screen.getByLabelText(texto))

describe('QuestionarioAluno', () => {
  it('só habilita o envio com todas as perguntas respondidas e envia os índices na ordem', async () => {
    const enviar = vi.fn().mockResolvedValue(correcao([true, true]))
    render(<QuestionarioAluno conteudo={CONTEUDO} progresso={{ concluida: false }} enviar={enviar} />)
    expect(enviarBotao().disabled).toBe(true)
    marcar('Quantas mandarmos')
    expect(enviarBotao().disabled).toBe(true)
    marcar('Repita')
    expect(enviarBotao().disabled).toBe(false)
    await act(async () => fireEvent.click(enviarBotao()))
    expect(enviar).toHaveBeenCalledWith([1, 0])
    expect(screen.getByText('Você passou! Acertou 2 de 2 (100%).')).toBeTruthy()
    expect(screen.getByText('Página concluída')).toBeTruthy()
  })

  it('reprovado: ✓/✗ por pergunta sem revelar a certa, mensagem e "Tentar de novo" limpa', async () => {
    const enviar = vi.fn().mockResolvedValue(correcao([true, false]))
    render(<QuestionarioAluno conteudo={CONTEUDO} progresso={{ concluida: false }} enviar={enviar} />)
    marcar('Quantas mandarmos')
    marcar('Se')
    await act(async () => fireEvent.click(enviarBotao()))

    expect(screen.getByText('Você acertou 1 de 2 (50%). Para passar são necessários 70%. Tente de novo.')).toBeTruthy()
    expect(screen.getAllByText('Resposta certa')).toHaveLength(1)
    expect(screen.getAllByText('Resposta errada')).toHaveLength(1)
    // Nenhuma alternativa é destacada como "a certa": só as escolhas do aluno aparecem marcadas.
    expect(document.body.textContent).not.toMatch(/correta|alternativa certa é/i)
    expect(screen.getByText('Melhor resultado: 50% · Tentativas: 1')).toBeTruthy()
    expect(screen.queryByText('Página concluída')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    const radios = screen.getAllByRole('radio') as HTMLInputElement[]
    expect(radios.some((r) => r.checked)).toBe(false)
    expect(enviarBotao().disabled).toBe(true)
  })

  it('selo "Página concluída" permanece numa nova tentativa reprovada se já aprovado antes', async () => {
    const enviar = vi.fn().mockResolvedValue(correcao([false, false], { aprovadoNaPagina: true, melhorPercentual: 100, tentativas: 3 }))
    render(
      <QuestionarioAluno
        conteudo={CONTEUDO}
        progresso={{ concluida: true, questionario: { tentativas: 2, melhorPercentual: 100, aprovado: true } }}
        enviar={enviar}
      />
    )
    expect(screen.getByText('Página concluída')).toBeTruthy()
    expect(screen.getByText('Melhor resultado: 100% · Tentativas: 2')).toBeTruthy()
    marcar('Uma')
    marcar('Mover')
    await act(async () => fireEvent.click(enviarBotao()))
    expect(screen.getByText(/Você acertou 0 de 2/)).toBeTruthy()
    expect(screen.getByText('Página concluída')).toBeTruthy()
    expect(screen.getByText('Melhor resultado: 100% · Tentativas: 3')).toBeTruthy()
  })

  it('erro no envio mostra a mensagem e permite tentar de novo', async () => {
    const enviar = vi.fn().mockRejectedValue(new Error('rede'))
    render(<QuestionarioAluno conteudo={CONTEUDO} progresso={{ concluida: false }} enviar={enviar} />)
    marcar('Uma')
    marcar('Se')
    await act(async () => fireEvent.click(enviarBotao()))
    expect(screen.getByRole('alert').textContent).toMatch(/Não foi possível enviar/)
    expect(enviarBotao().disabled).toBe(false)
  })
})
