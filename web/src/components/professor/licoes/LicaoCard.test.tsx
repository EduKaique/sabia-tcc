// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { LicaoCard } from './LicaoCard'

afterEach(cleanup)

describe('LicaoCard', () => {
  it('mostra o resumo e só o botão "Ver lição", que leva à página da lição', () => {
    render(
      <LicaoCard
        licao={{
          id: 7,
          estado: 'PUBLICADA',
          titulo: 'Laços',
          conceito: 'Repetição',
          resumo: null,
          modo: 'BLOCOS',
          turmas: [{ id: 10, nome: '5º A' }],
          quantidadePaginas: 3,
          atualizadaEm: '2026-11-12T12:00:00',
        }}
      />
    )
    expect(screen.getByText('Laços')).toBeTruthy()
    expect(screen.getByText('3 páginas')).toBeTruthy()
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0].getAttribute('href')).toBe('/professor/licoes/7')
    expect(links[0].textContent).toContain('Ver lição')
    expect(screen.queryByRole('button')).toBeNull()
  })
})
