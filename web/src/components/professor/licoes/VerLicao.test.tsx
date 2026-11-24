// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import type { ProgressoLicaoProfessor } from '@/types/licaoProfessor'
import { VerLicao } from './VerLicao'

const { consulta, publicar, despublicar, arquivar, replace } = vi.hoisted(() => ({
  consulta: { atual: {} as Record<string, unknown> },
  publicar: { mutate: vi.fn(), reset: vi.fn(), isPending: false, error: null as unknown },
  despublicar: { mutate: vi.fn(), reset: vi.fn(), isPending: false, error: null as unknown },
  arquivar: { mutate: vi.fn(), reset: vi.fn(), isPending: false, isError: false, error: null },
  replace: vi.fn(),
}))

vi.mock('@/hooks/useLicoesProfessor', () => ({
  useProgressoLicao: () => consulta.atual,
  usePublicarLicao: () => publicar,
  useDespublicarLicao: () => despublicar,
  useArquivarLicao: () => arquivar,
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }))

const refetch = vi.fn()
const definir = (extra: Record<string, unknown>) => {
  consulta.atual = { data: undefined, isLoading: false, isError: false, error: null, isFetching: false, refetch, ...extra }
}

const resposta = (extra: Partial<ProgressoLicaoProfessor> = {}): ProgressoLicaoProfessor => ({
  licao: { id: 7, titulo: 'Laços', conceito: 'Repetição', modo: 'BLOCOS', estado: 'PUBLICADA', publicadaEm: '2026-11-01T10:00:00' },
  paginas: [
    { id: 11, ordem: 0, tipo: 'TEXTO', titulo: 'O que é um laço' },
    { id: 12, ordem: 1, tipo: 'QUESTIONARIO', titulo: 'Confira' },
  ],
  totalAlunos: 2,
  concluiram: 1,
  turmas: [
    {
      turmaId: 10,
      turmaNome: '5º A',
      alunos: [
        {
          alunoId: 8,
          nome: 'Álvaro',
          estado: 'CONCLUIDA',
          paginasConcluidas: 2,
          melhorPercentualQuestionario: 100,
          atividadeConcluida: true,
          concluidaEm: '2026-11-12T12:00:00',
          paginas: [
            { paginaId: 11, concluida: true, melhorPercentual: null, tentativas: null },
            { paginaId: 12, concluida: true, melhorPercentual: 100, tentativas: 1 },
          ],
        },
        {
          alunoId: 2,
          nome: 'Bruno',
          estado: 'EM_ANDAMENTO',
          paginasConcluidas: 1,
          melhorPercentualQuestionario: 50,
          atividadeConcluida: false,
          concluidaEm: null,
          paginas: [
            { paginaId: 11, concluida: true, melhorPercentual: null, tentativas: null },
            { paginaId: 12, concluida: false, melhorPercentual: 50, tentativas: 2 },
          ],
        },
      ],
    },
    { turmaId: 11, turmaNome: '5º B', alunos: [] },
  ],
  ...extra,
})

beforeEach(() => {
  refetch.mockReset()
  publicar.mutate.mockReset()
  despublicar.mutate.mockReset()
  arquivar.mutate.mockReset()
  replace.mockReset()
})
afterEach(cleanup)

describe('VerLicao: relatório', () => {
  it('um bloco por turma; tabela com colunas por página e células com texto (não só cor)', () => {
    definir({ data: resposta() })
    render(<VerLicao licaoId={7} />)

    expect(screen.getByRole('heading', { name: /Laços/, level: 1 })).toBeTruthy()
    expect(screen.getByText('1 de 2 concluíram')).toBeTruthy()
    expect(screen.getByText('5º A, 5º B')).toBeTruthy()

    const tabela = screen.getByRole('table', { name: 'Progresso dos alunos da turma 5º A' })
    expect(within(tabela).getAllByRole('columnheader').map((c) => c.textContent)).toEqual([
      'Aluno',
      'Situação',
      '1 · TextoO que é um laço',
      '2 · QuestionárioConfira',
    ])
    expect(within(tabela).getAllByRole('rowheader').map((r) => r.textContent)).toEqual(['Álvaro', 'Bruno'])
    expect(within(tabela).getByRole('cell', { name: 'Álvaro: Concluída em 12/11/2026, 2 de 2 páginas, questionário 100%' })).toBeTruthy()
    const quizBruno = within(tabela).getByRole('cell', { name: 'Bruno, página 2 (Questionário): Pendente, 50% · 2 tentativas' })
    expect(quizBruno.textContent).toContain('Pendente')
    expect(quizBruno.textContent).toContain('50% · 2 tentativas')
    expect(within(tabela).getByText('Prática concluída')).toBeTruthy()

    const turmaB = screen.getByRole('region', { name: /5º B/ })
    expect(within(turmaB).getByText('Nenhum aluno matriculado nesta turma.')).toBeTruthy()
  })

  it('legenda com os 4 estados e lista do celular com as páginas de cada aluno', () => {
    definir({ data: resposta() })
    render(<VerLicao licaoId={7} />)
    expect(within(screen.getByRole('list', { name: 'Legenda dos estados' })).getAllByRole('listitem')).toHaveLength(4)
    const cartoes = screen.getByRole('list', { name: 'Progresso por aluno — 5º A' })
    expect(within(cartoes).getByRole('listitem', { name: 'Bruno, página 1 (Texto): Concluída' })).toBeTruthy()
  })

  it('sem turma vinculada: orienta vincular em Editar', () => {
    definir({ data: resposta({ turmas: [], totalAlunos: 0, concluiram: 0 }) })
    render(<VerLicao licaoId={7} />)
    expect(screen.getByText(/ainda não está vinculada a nenhuma turma/)).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('erro com "Tentar de novo"; 403 mostra a mensagem sem tentar de novo', () => {
    definir({ isError: true, error: { response: { status: 500, data: {} } } })
    const { unmount } = render(<VerLicao licaoId={7} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(refetch).toHaveBeenCalledOnce()
    unmount()

    definir({ isError: true, error: { response: { status: 403, data: {} } } })
    render(<VerLicao licaoId={7} />)
    expect(screen.getByText('Você não tem acesso a esta lição.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  })

  it('carregando mostra o esqueleto', () => {
    definir({ isLoading: true })
    render(<VerLicao licaoId={7} />)
    expect(screen.getByLabelText('Carregando a lição')).toBeTruthy()
  })
})

describe('VerLicao: ações', () => {
  it('publicada: Editar aponta para o editor, Despublicar chama a mutação e Atualizar recarrega', () => {
    definir({ data: resposta() })
    render(<VerLicao licaoId={7} />)
    expect(screen.getByRole('link', { name: /Editar/ }).getAttribute('href')).toBe('/professor/licoes/7/editar')
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Despublicar' }))
    expect(despublicar.mutate).toHaveBeenCalledWith(7)
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('rascunho: Publicar chama a mutação e mostra o aviso de que os alunos não veem', () => {
    definir({ data: resposta({ licao: { ...resposta().licao, estado: 'RASCUNHO', publicadaEm: null } }) })
    render(<VerLicao licaoId={7} />)
    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }))
    expect(publicar.mutate).toHaveBeenCalledWith(7)
    expect(screen.getByText('Os alunos não veem esta lição enquanto ela não for publicada.')).toBeTruthy()
  })

  it('Arquivar abre a confirmação; ao confirmar, arquiva e volta para a lista', () => {
    arquivar.mutate.mockImplementation((_id: number, opcoes: { onSuccess: () => void }) => opcoes.onSuccess())
    definir({ data: resposta() })
    render(<VerLicao licaoId={7} />)
    fireEvent.click(screen.getByRole('button', { name: 'Arquivar' }))
    const dialogo = screen.getByRole('alertdialog')
    expect(within(dialogo).getByText(/"Laços" sai da sua lista/)).toBeTruthy()
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Arquivar' }))
    expect(arquivar.mutate).toHaveBeenCalledWith(7, expect.anything())
    expect(replace).toHaveBeenCalledWith('/professor/licoes')
  })

  it('arquivada: só o aviso e Atualizar, sem Editar, Publicar nem Arquivar', () => {
    definir({ data: resposta({ licao: { ...resposta().licao, estado: 'ARQUIVADA' } }) })
    render(<VerLicao licaoId={7} />)
    expect(screen.getByText(/Esta lição está arquivada/)).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Editar/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Publicar|Despublicar|Arquivar/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Atualizar' })).toBeTruthy()
  })
})
