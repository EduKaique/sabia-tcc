// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ResultadoCorrecao } from '@/components/aluno/atividades/ResultadoCorrecao'
import type { AtividadeAlunoDTO } from '@/types/atividade'

// next/font só funciona no build do Next; no teste basta uma classe vazia.
vi.mock('@/lib/fontesHome', () => ({ fredoka: { className: '' } }))

afterEach(cleanup)

const base: AtividadeAlunoDTO = {
  id: 1,
  titulo: 'Labirinto',
  descricao: '',
  dataEntrega: '2026-11-30T23:59:00',
  pontuacaoMaxima: 10,
  status: 'CORRIGIDA',
  modo: 'BLOCOS',
  cenarioJson: null,
  nota: 8.5,
  feedbackProfessor: 'Muito bem!\nRevise o laço.',
  avaliadaEm: '2026-11-10T14:30:00',
}

describe('ResultadoCorrecao', () => {
  it('mostra a nota com vírgula e o comentário quando corrigida', () => {
    render(<ResultadoCorrecao atividade={base} />)
    expect(screen.getByText('8,5 / 10')).toBeTruthy()
    expect(screen.getByText('Comentário do professor')).toBeTruthy()
    expect(screen.getByText(/Revise o laço/)).toBeTruthy()
    expect(screen.getByText(/Corrigida em/)).toBeTruthy()
  })

  it('não mostra nada enquanto a atividade está em avaliação', () => {
    const { container } = render(
      <ResultadoCorrecao
        atividade={{ ...base, status: 'ENTREGUE', nota: null, feedbackProfessor: null, avaliadaEm: null }}
      />,
    )
    expect(container.innerHTML).toBe('')
    expect(screen.queryByText('Resultado')).toBeNull()
  })
})
