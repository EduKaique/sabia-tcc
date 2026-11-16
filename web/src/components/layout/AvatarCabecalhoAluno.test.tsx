// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { AvatarCabecalhoAluno } from '@/components/layout/AvatarCabecalhoAluno'

// next/font só funciona no build do Next; no teste basta uma classe vazia.
vi.mock('@/lib/fontesHome', () => ({ fredoka: { className: '' } }))

afterEach(cleanup)

describe('AvatarCabecalhoAluno', () => {
  it('mostra o avatar escolhido pelo aluno no lugar da inicial', () => {
    const { container } = render(<AvatarCabecalhoAluno nome="Carlos Aluno" avatar="sabia-roxo" />)

    expect(container.querySelector('svg')).not.toBeNull()
    expect(screen.queryByText('C')).toBeNull()
  })

  it('mostra a inicial quando o aluno ainda não tem avatar', () => {
    const { container } = render(<AvatarCabecalhoAluno nome="Carlos Aluno" avatar={undefined} />)

    expect(screen.getByText('C')).toBeTruthy()
    expect(container.querySelector('svg')).toBeNull()
  })

  it('mostra a inicial quando o avatar não está no catálogo', () => {
    render(<AvatarCabecalhoAluno nome="carlos" avatar="avatar-1.png" />)

    expect(screen.getByText('C')).toBeTruthy()
  })
})
