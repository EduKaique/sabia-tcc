// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { EditorCenario } from './EditorCenario'

afterEach(cleanup)

describe('EditorCenario', () => {
  it('a ferramenta Obstáculo marca a casa clicada', () => {
    render(<EditorCenario onSalvar={() => {}} onCancelar={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'Obstáculo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Linha 3, coluna 3: vazia' }))

    expect(screen.getByRole('button', { name: 'Linha 3, coluna 3: obstáculo' })).toBeTruthy()
  })

  it('Salvar envia o nome e o cenário montado', () => {
    const onSalvar = vi.fn()
    render(<EditorCenario onSalvar={onSalvar} onCancelar={() => {}} />)

    fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: '  Labirinto  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Obstáculo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Linha 2, coluna 2: vazia' }))
    fireEvent.change(screen.getByLabelText('Limite de blocos (opcional)'), { target: { value: '6' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onSalvar).toHaveBeenCalledTimes(1)
    const { nome, cenarioJson } = onSalvar.mock.calls[0][0]
    expect(nome).toBe('Labirinto')
    expect(JSON.parse(cenarioJson)).toEqual({
      versao: 1,
      linhas: 5,
      colunas: 5,
      inicio: { linha: 4, coluna: 0 },
      destino: { linha: 0, coluna: 4 },
      obstaculos: [{ linha: 1, coluna: 1 }],
      blocosPermitidos: ['robo_mover', 'robo_repetir'],
      maxBlocos: 6,
    })
  })

  it('Salvar fica desabilitado sem nome ou sem blocos permitidos', () => {
    render(<EditorCenario onSalvar={() => {}} onCancelar={() => {}} />)
    const salvar = () => screen.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement

    expect(salvar().disabled).toBe(true)
    fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: 'Labirinto' } })
    expect(salvar().disabled).toBe(false)
    fireEvent.click(screen.getByLabelText('Mover'))
    fireEvent.click(screen.getByLabelText('Repetir'))
    expect(salvar().disabled).toBe(true)
  })

  it('mostra o erro do servidor', () => {
    render(
      <EditorCenario
        onSalvar={() => {}}
        onCancelar={() => {}}
        erro="O cenário não tem caminho do início ao destino."
      />
    )
    expect(screen.getByRole('alert').textContent).toBe('O cenário não tem caminho do início ao destino.')
  })
})
