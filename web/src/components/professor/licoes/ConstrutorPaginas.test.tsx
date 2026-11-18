// @vitest-environment jsdom
import { useReducer } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MAX_PAGINAS, editorReducer, estadoInicialEditor, type EstadoEditor } from '@/lib/licoes/editorLicao'
import { ConstrutorPaginas } from './ConstrutorPaginas'

// O editor rico (TipTap) não interessa aqui: um textarea simples no lugar.
vi.mock('@/components/professor/atividades/RichTextEditor', () => ({
  RichTextEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="Texto rico" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}))

afterEach(cleanup)

function Construtor({ inicial = estadoInicialEditor() }: { inicial?: EstadoEditor }) {
  const [estado, dispatch] = useReducer(editorReducer, inicial)
  return <ConstrutorPaginas paginas={estado.paginas} dispatch={dispatch} erros={{}} />
}

const paginas = () => screen.getAllByRole('listitem')
const titulos = () => screen.getAllByLabelText('Título da página (opcional)') as HTMLInputElement[]

describe('ConstrutorPaginas', () => {
  it('adiciona, move e remove páginas', () => {
    render(<Construtor />)

    fireEvent.click(screen.getByRole('button', { name: 'Texto' }))
    fireEvent.click(screen.getByRole('button', { name: 'Imagem e texto' }))
    expect(paginas()).toHaveLength(2)
    expect(within(paginas()[1]).getByText('Imagem e texto')).toBeTruthy()

    fireEvent.change(titulos()[0], { target: { value: 'Primeira' } })
    fireEvent.click(screen.getByRole('button', { name: 'Mover página 1 para baixo' }))
    expect(within(paginas()[1]).getByText('Primeira')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Mover página 1 para cima' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Mover página 2 para baixo' }) as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Remover página 2' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }))
    expect(paginas()).toHaveLength(1)
    expect(screen.queryByText('Primeira')).toBeNull()
  })

  it('recolhe e abre o cartão da página', () => {
    render(<Construtor />)
    fireEvent.click(screen.getByRole('button', { name: 'Texto' }))
    expect(titulos()).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Recolher página 1' }))
    expect(screen.queryAllByLabelText('Título da página (opcional)')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir página 1' }))
    expect(titulos()).toHaveLength(1)
  })

  it('desabilita adicionar no limite de 30 páginas', () => {
    let cheio = estadoInicialEditor()
    for (let i = 0; i < MAX_PAGINAS; i++) cheio = editorReducer(cheio, { tipo: 'adicionarPagina', tipoPagina: 'TEXTO' })
    render(<Construtor inicial={cheio} />)

    expect((screen.getByRole('button', { name: 'Texto' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Imagem e texto' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(`Limite de ${MAX_PAGINAS} páginas atingido.`)).toBeTruthy()
  })

  it('mostra vídeo e questionário como resumo, sem formulário', () => {
    const inicial = editorReducer(estadoInicialEditor(), {
      tipo: 'carregar',
      detalhe: {
        id: 1, estado: 'RASCUNHO', titulo: 'L', conceito: 'C', resumo: null, modo: 'BLOCOS', cenarioJson: null,
        turmaIds: [], publicadaEm: null, criadaEm: null, atualizadaEm: null,
        paginas: [
          { id: 5, ordem: 0, tipo: 'QUESTIONARIO', titulo: 'Quiz', conteudo: { percentualMinimo: 70, perguntas: [{ enunciado: 'e', alternativas: ['a', 'b'], correta: 1 }] } },
        ],
      },
    })
    render(<Construtor inicial={inicial} />)

    expect(screen.getByText(/1 pergunta · mínimo para aprovar: 70%/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Abrir página 1/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Remover página 1' })).toBeTruthy()
  })
})
