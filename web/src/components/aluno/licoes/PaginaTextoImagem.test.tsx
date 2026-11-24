// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { PaginaImagem } from './PaginaImagem'
import { PaginaTexto } from './PaginaTexto'

afterEach(cleanup)

describe('PaginaTexto', () => {
  it('sanitiza o HTML (script removido) e registra a vista uma única vez', () => {
    const aoAbrir = vi.fn()
    const { container, rerender } = render(
      <PaginaTexto conteudo={{ html: '<h2>Laços</h2><p>Repetir</p><script>alert(1)</script>' }} progresso={{ concluida: false }} aoAbrir={aoAbrir} />
    )
    expect(screen.getByRole('heading', { name: 'Laços' })).toBeTruthy()
    expect(container.querySelector('script')).toBeNull()
    rerender(<PaginaTexto conteudo={{ html: '<p>Repetir</p>' }} progresso={{ concluida: false }} aoAbrir={aoAbrir} />)
    expect(aoAbrir).toHaveBeenCalledTimes(1)
  })

  it('não chama a vista quando a página já está concluída', () => {
    const aoAbrir = vi.fn()
    render(<PaginaTexto conteudo={{ html: '<p>Oi</p>' }} progresso={{ concluida: true }} aoAbrir={aoAbrir} />)
    expect(aoAbrir).not.toHaveBeenCalled()
  })
})

describe('PaginaImagem', () => {
  const conteudo = { imagemUrl: 'https://x.org/gato.png', alt: 'Um gato', legenda: 'Figura 1', html: '<p>Texto da imagem</p>' }

  it('mostra a imagem com alt, sem referrer, preguiçosa, com legenda; registra a vista', () => {
    const aoAbrir = vi.fn()
    render(<PaginaImagem conteudo={conteudo} progresso={{ concluida: false }} aoAbrir={aoAbrir} />)
    const img = screen.getByRole('img', { name: 'Um gato' })
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer')
    expect(img.getAttribute('loading')).toBe('lazy')
    expect(screen.getByText('Figura 1')).toBeTruthy()
    expect(aoAbrir).toHaveBeenCalledTimes(1)
  })

  it('erro de carregamento mostra a mensagem e mantém o texto', () => {
    render(<PaginaImagem conteudo={conteudo} progresso={{ concluida: true }} aoAbrir={vi.fn()} />)
    fireEvent.error(screen.getByRole('img', { name: 'Um gato' }))
    expect(screen.getByText(/Não foi possível carregar a imagem/)).toBeTruthy()
    expect(screen.getByText('Texto da imagem')).toBeTruthy()
  })
})
