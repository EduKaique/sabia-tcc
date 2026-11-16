// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { SemaforoRobo, TEXTO_FASE } from '@/components/aluno/editor/SemaforoRobo'

afterEach(cleanup)

describe('SemaforoRobo', () => {
  it('mostra o texto da fase', () => {
    render(<SemaforoRobo fase="CHEGOU" />)
    expect(screen.getByText(TEXTO_FASE.CHEGOU)).toBeTruthy()
  })

  it('muda o texto quando o robô bate', () => {
    render(<SemaforoRobo fase="COLIDIU" />)
    expect(screen.getByText('Bateu num obstáculo')).toBeTruthy()
  })
})
