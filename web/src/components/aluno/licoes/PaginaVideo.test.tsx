// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AxiosError, AxiosHeaders } from 'axios'
import type { OpcoesPlayer } from '@/lib/licoes/carregadorYoutube'
import type { ProgressoPagina, PulsoVideo } from '@/types/licao'
import { PaginaVideo } from './PaginaVideo'

const { carregar, players } = vi.hoisted(() => ({ carregar: vi.fn(), players: [] as PlayerFalso[] }))

vi.mock('@/lib/licoes/carregadorYoutube', async (original) => ({
  ...(await original<typeof import('@/lib/licoes/carregadorYoutube')>()),
  carregarApiYoutube: carregar,
}))

class PlayerFalso {
  iframe = document.createElement('iframe')
  getDuration = vi.fn(() => 10)
  getIframe = vi.fn(() => this.iframe)
  pauseVideo = vi.fn()
  destroy = vi.fn()
  constructor(
    public alvo: HTMLElement,
    public opcoes: OpcoesPlayer
  ) {
    alvo.appendChild(this.iframe)
    players.push(this)
  }
  pronto() {
    act(() => this.opcoes.events?.onReady?.({ target: this }))
  }
  estado(data: number) {
    act(() => this.opcoes.events?.onStateChange?.({ target: this, data }))
  }
}

const CONTEUDO = { videoId: 'dQw4w9WgXcQ', titulo: 'Aula de laços', duracaoSegundos: 10 }
const progresso = (creditados: number, conferido = false): ProgressoPagina => ({
  concluida: conferido,
  video: { segundosCreditados: creditados, segundosNecessarios: 7, conferido },
})
const pulso = (creditados: number, conferido = false): PulsoVideo => ({
  paginaId: 5,
  segundosCreditados: creditados,
  segundosNecessarios: 7,
  conferido,
  praticaLiberada: false,
})
const esperarApi = () => act(async () => {})
const erroHttp = (status: number) =>
  new AxiosError('x', 'ERR', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {},
  })

beforeEach(() => {
  players.length = 0
  carregar.mockReset()
  carregar.mockResolvedValue({ Player: PlayerFalso })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('PaginaVideo', () => {
  it('cria o player nocookie com title e manda pulso ao tocar; a barra segue o progresso recebido', async () => {
    const enviarPulso = vi.fn().mockResolvedValue(pulso(0))
    const { rerender } = render(<PaginaVideo conteudo={CONTEUDO} progresso={progresso(0)} enviarPulso={enviarPulso} />)
    await esperarApi()
    const p = players[0]
    expect(p.opcoes).toMatchObject({
      host: 'https://www.youtube-nocookie.com',
      videoId: 'dQw4w9WgXcQ',
      playerVars: { rel: 0, playsinline: 1 },
    })
    p.pronto()
    expect(p.iframe.getAttribute('title')).toBe('Aula de laços')
    expect(screen.getByText('Você assistiu 0:00 de 0:07')).toBeTruthy()
    expect(screen.getByText('Mantenha esta aba aberta enquanto assiste.')).toBeTruthy()

    p.estado(1)
    expect(enviarPulso).toHaveBeenCalledTimes(1)
    // A resposta do pulso atualiza o cache, que chega aqui como progresso novo.
    rerender(<PaginaVideo conteudo={CONTEUDO} progresso={progresso(5)} enviarPulso={enviarPulso} />)
    expect(screen.getByText('Você assistiu 0:05 de 0:07')).toBeTruthy()
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('71')

    rerender(<PaginaVideo conteudo={CONTEUDO} progresso={progresso(7, true)} enviarPulso={enviarPulso} />)
    expect(screen.getByText('Vídeo concluído')).toBeTruthy()
  })

  it('sem botão "já assisti" nem atalho; pausar envia o pulso extra', async () => {
    vi.useFakeTimers()
    const enviarPulso = vi.fn().mockResolvedValue(pulso(0))
    render(<PaginaVideo conteudo={CONTEUDO} progresso={progresso(0)} enviarPulso={enviarPulso} />)
    await esperarApi()
    players[0].pronto()
    expect(screen.queryByRole('button')).toBeNull()
    players[0].estado(1)
    await act(async () => {})
    await act(async () => vi.advanceTimersByTime(10_000))
    expect(enviarPulso).toHaveBeenCalledTimes(2)
    players[0].estado(2)
    expect(enviarPulso).toHaveBeenCalledTimes(3)
  })

  it('a IFrame API não carrega: mensagem simples com "Tentar de novo", que recarrega, e sem atalho', async () => {
    carregar.mockRejectedValueOnce(new Error('bloqueado'))
    render(<PaginaVideo conteudo={CONTEUDO} progresso={progresso(0)} enviarPulso={vi.fn()} />)
    await esperarApi()
    expect(screen.getByRole('alert').textContent).toMatch(/Não conseguimos carregar o vídeo/)
    const botoes = screen.getAllByRole('button')
    expect(botoes.map((b) => b.textContent)).toEqual(['Tentar de novo'])

    fireEvent.click(botoes[0])
    await esperarApi()
    expect(carregar).toHaveBeenCalledTimes(2)
    expect(players).toHaveLength(1)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('erro do player (bloqueado para incorporação) mostra mensagem e "Tentar de novo"', async () => {
    render(<PaginaVideo conteudo={CONTEUDO} progresso={progresso(0)} enviarPulso={vi.fn()} />)
    await esperarApi()
    act(() => players[0].opcoes.events?.onError?.({ target: players[0], data: 150 }))
    expect(screen.getByRole('alert').textContent).toMatch(/não pode ser exibido aqui/)
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
  })

  it('pulso com 422 para os pulsos e mostra mensagem curta', async () => {
    vi.useFakeTimers()
    const enviarPulso = vi.fn().mockRejectedValue(erroHttp(422))
    render(<PaginaVideo conteudo={CONTEUDO} progresso={progresso(0)} enviarPulso={enviarPulso} />)
    await esperarApi()
    players[0].pronto()
    players[0].estado(1)
    await act(async () => {})
    expect(screen.getByText(/Não foi possível registrar o tempo assistido/)).toBeTruthy()
    await act(async () => vi.advanceTimersByTime(30_000))
    expect(enviarPulso).toHaveBeenCalledTimes(1)
  })

  it('já conferido: não envia pulsos', async () => {
    const enviarPulso = vi.fn()
    render(<PaginaVideo conteudo={CONTEUDO} progresso={progresso(7, true)} enviarPulso={enviarPulso} />)
    await esperarApi()
    players[0].pronto()
    players[0].estado(1)
    expect(enviarPulso).not.toHaveBeenCalled()
    expect(screen.getByText('Vídeo concluído')).toBeTruthy()
  })

  it('destrói o player ao desmontar (trocar de página) e manda o último pulso se tocando', async () => {
    const enviarPulso = vi.fn().mockResolvedValue(pulso(3))
    const { unmount } = render(<PaginaVideo conteudo={CONTEUDO} progresso={progresso(0)} enviarPulso={enviarPulso} />)
    await esperarApi()
    players[0].pronto()
    players[0].estado(1)
    await act(async () => {})
    unmount()
    expect(players[0].destroy).toHaveBeenCalledOnce()
    expect(enviarPulso).toHaveBeenCalledTimes(2)
  })

  it('trocar de vídeo destrói o player anterior', async () => {
    const { rerender } = render(<PaginaVideo conteudo={CONTEUDO} progresso={progresso(0)} enviarPulso={vi.fn()} />)
    await esperarApi()
    rerender(<PaginaVideo conteudo={{ ...CONTEUDO, videoId: 'a-b_C1234Z9' }} progresso={progresso(0)} enviarPulso={vi.fn()} />)
    await esperarApi()
    expect(players[0].destroy).toHaveBeenCalledOnce()
    expect(players[1].opcoes.videoId).toBe('a-b_C1234Z9')
  })
})
