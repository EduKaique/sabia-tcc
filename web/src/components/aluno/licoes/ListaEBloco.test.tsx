// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import type { LicaoResumo, PaginaAluno } from '@/types/licao'
import { BlocoAtividade } from './BlocoAtividade'
import { LicaoCard } from './LicaoCard'
import { ListaLicoes } from './ListaLicoes'
import { NavegadorPaginas } from './NavegadorPaginas'

// next/font só funciona no build do Next; no teste basta uma classe vazia.
vi.mock('@/lib/fontesHome', () => ({ fredoka: { className: '' } }))

afterEach(cleanup)

const resumo = (extra: Partial<LicaoResumo> = {}): LicaoResumo => ({
  id: 1,
  titulo: 'Laços',
  conceito: 'Repetição',
  resumo: 'Aprenda a repetir comandos.',
  modo: 'BLOCOS',
  estado: 'NAO_INICIADA',
  totalPaginas: 4,
  paginasConcluidas: 0,
  atividadeConcluida: false,
  concluidaEm: null,
  turmas: [{ id: 10, nome: 'Programação I' }],
  ...extra,
})

const pagina = (id: number, tipo: PaginaAluno['tipo'], concluida: boolean) => ({
  id,
  tipo,
  progresso: { concluida },
})

describe('LicaoCard', () => {
  it('mostra estado, barra de páginas, modo e chips de turma', () => {
    render(<LicaoCard licao={resumo({ turmas: [{ id: 10, nome: 'Programação I' }, { id: 11, nome: 'Turma B' }] })} />)
    expect(screen.getByText('Não iniciada')).toBeTruthy()
    expect(screen.getByText('0 de 4 páginas')).toBeTruthy()
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0')
    expect(screen.getByText('Programação em blocos')).toBeTruthy()
    expect(screen.getByText('Programação I')).toBeTruthy()
    expect(screen.getByText('Turma B')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Começar/ }).getAttribute('href')).toBe('/aluno/aprender/1')
  })

  it('rótulos de cada estado e "Atividade concluída"', () => {
    const { rerender } = render(<LicaoCard licao={resumo({ estado: 'EM_ANDAMENTO', paginasConcluidas: 2 })} />)
    expect(screen.getByText('Em andamento')).toBeTruthy()
    expect(screen.getByText('2 de 4 páginas')).toBeTruthy()
    rerender(<LicaoCard licao={resumo({ estado: 'PRATICA_LIBERADA', paginasConcluidas: 4, modo: 'JOGO_ROBO' })} />)
    expect(screen.getByText('Prática liberada')).toBeTruthy()
    expect(screen.getByText('Jogo do Robô')).toBeTruthy()
    rerender(<LicaoCard licao={resumo({ estado: 'CONCLUIDA', paginasConcluidas: 4, atividadeConcluida: true })} />)
    expect(screen.getByText(/Concluída/)).toBeTruthy()
    expect(screen.getByText('Atividade concluída')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Rever/ })).toBeTruthy()
  })
})

describe('ListaLicoes', () => {
  it('estado vazio amigável', () => {
    render(<ListaLicoes licoes={[]} />)
    expect(screen.getByText('Seu professor ainda não publicou lições para a sua turma.')).toBeTruthy()
  })

  it('sem filtro com uma turma só; com filtro a partir de duas turmas; ordem do servidor', () => {
    const { rerender } = render(<ListaLicoes licoes={[resumo(), resumo({ id: 2, titulo: 'Condições' })]} />)
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.getAllByRole('heading').map((h) => h.textContent)).toEqual(['Laços', 'Condições'])

    rerender(<ListaLicoes licoes={[resumo(), resumo({ id: 2, titulo: 'Condições', turmas: [{ id: 11, nome: 'Turma B' }] })]} />)
    expect(screen.getByRole('combobox')).toBeTruthy()
  })
})

describe('BlocoAtividade', () => {
  const base = { id: 7, concluidaEm: null as string | null }

  it('desabilitado com as pendências clicáveis que levam à página', () => {
    const onIrPagina = vi.fn()
    render(
      <BlocoAtividade
        licao={{ ...base, praticaLiberada: false, paginas: [pagina(1, 'TEXTO', true), pagina(2, 'VIDEO_YOUTUBE', false), pagina(3, 'QUESTIONARIO', false)] as PaginaAluno[] }}
        onIrPagina={onIrPagina}
      />
    )
    expect((screen.getByRole('button', { name: 'Ir para a atividade' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('Falta concluir:')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Página 3 - Questionário' }))
    expect(onIrPagina).toHaveBeenCalledWith(2)
    expect(screen.getByRole('button', { name: 'Página 2 - Vídeo' })).toBeTruthy()
  })

  it('habilitado (link) com praticaLiberada; "Refazer a atividade" quando concluída', () => {
    const { rerender } = render(<BlocoAtividade licao={{ ...base, praticaLiberada: true, paginas: [] }} onIrPagina={vi.fn()} />)
    expect(screen.getByRole('link', { name: /Ir para a atividade/ }).getAttribute('href')).toBe('/aluno/aprender/7/editor')
    expect(screen.queryByText('Falta concluir:')).toBeNull()
    rerender(
      <BlocoAtividade licao={{ ...base, concluidaEm: '2026-11-18T10:00:00', praticaLiberada: true, paginas: [] }} onIrPagina={vi.fn()} />
    )
    expect(screen.getByRole('link', { name: /Refazer a atividade/ })).toBeTruthy()
    expect(screen.getByText('Parabéns! Você concluiu esta lição.')).toBeTruthy()
  })
})

describe('NavegadorPaginas', () => {
  const paginas = [pagina(1, 'TEXTO', true), pagina(2, 'VIDEO_YOUTUBE', false), pagina(3, 'QUESTIONARIO', false)] as PaginaAluno[]

  it('Anterior e Próxima desabilitados nas pontas; passos com página atual e concluídas', () => {
    const onIr = vi.fn()
    const { rerender } = render(<NavegadorPaginas paginas={paginas} indice={0} onIr={onIr} />)
    expect((screen.getByRole('button', { name: /Anterior/ }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Página 1: Texto (concluída)' }).getAttribute('aria-current')).toBe('step')
    fireEvent.click(screen.getByRole('button', { name: /Próxima/ }))
    expect(onIr).toHaveBeenCalledWith(1)

    rerender(<NavegadorPaginas paginas={paginas} indice={2} onIr={onIr} />)
    expect((screen.getByRole('button', { name: /Próxima/ }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText('Página 3 de 3')).toBeTruthy()
  })

  it('navegação livre: qualquer passo leva à página, mesmo sem concluir as anteriores', () => {
    const onIr = vi.fn()
    render(<NavegadorPaginas paginas={paginas} indice={0} onIr={onIr} />)
    const passos = within(screen.getByRole('list')).getAllByRole('button')
    expect(passos).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: 'Página 3: Questionário' }))
    expect(onIr).toHaveBeenCalledWith(2)
  })
})
