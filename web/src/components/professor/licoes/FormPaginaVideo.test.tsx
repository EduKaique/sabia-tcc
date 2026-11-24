// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { OpcoesPlayer } from '@/lib/licoes/carregadorYoutube'
import type { ConteudoVideoEditor } from '@/lib/licoes/youtube'
import { FormPaginaVideo } from './FormPaginaVideo'

const { carregar, players } = vi.hoisted(() => ({ carregar: vi.fn(), players: [] as PlayerFalso[] }))

vi.mock('@/lib/licoes/carregadorYoutube', async (original) => ({
  ...(await original<typeof import('@/lib/licoes/carregadorYoutube')>()),
  carregarApiYoutube: carregar,
}))

class PlayerFalso {
  iframe = document.createElement('iframe')
  getDuration = vi.fn(() => 0)
  getVideoData = vi.fn(() => ({ title: 'Aula de laços', author: 'Canal Sabiá' }))
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
}

function Video({
  inicial = { videoId: '' },
  sugerirDados = true,
  aoMudar,
}: {
  inicial?: ConteudoVideoEditor
  sugerirDados?: boolean
  aoMudar?: (p: Partial<ConteudoVideoEditor>) => void
}) {
  const [c, setC] = useState<ConteudoVideoEditor>(inicial)
  return (
    <FormPaginaVideo
      idBase="v"
      conteudo={c}
      onChange={(p) => {
        aoMudar?.(p)
        setC((a) => ({ ...a, ...p }))
      }}
      erros={{}}
      sugerirDados={sugerirDados}
    />
  )
}

const campoLink = () => screen.getByLabelText(/Link ou código do vídeo/) as HTMLInputElement
const campoDuracao = () => screen.getByLabelText('Duração do vídeo (em segundos)') as HTMLInputElement
const esperarApi = () => act(async () => {})

beforeEach(() => {
  players.length = 0
  carregar.mockReset()
  carregar.mockResolvedValue({ Player: PlayerFalso })
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('FormPaginaVideo', () => {
  it('link válido mostra o player (nocookie) e, com a duração lida depois de 0, preenche e mostra a dica de 70%', async () => {
    render(<Video />)
    fireEvent.change(campoLink(), { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } })
    await esperarApi()

    expect(players).toHaveLength(1)
    const p = players[0]
    expect(p.opcoes).toMatchObject({
      host: 'https://www.youtube-nocookie.com',
      videoId: 'dQw4w9WgXcQ',
      playerVars: { rel: 0, playsinline: 1 },
    })
    expect(screen.getByRole('region', { name: 'Pré-visualização do vídeo do YouTube' })).toBeTruthy()

    p.getDuration.mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValue(212.4)
    p.pronto()
    expect(p.iframe.getAttribute('title')).toBe('Pré-visualização do vídeo do YouTube')
    expect(campoDuracao().value).toBe('')
    act(() => vi.advanceTimersByTime(500))

    expect(campoDuracao().value).toBe('212')
    expect(screen.getByText('O aluno precisará assistir pelo menos 2:29 (70%).')).toBeTruthy()
    expect(screen.getByText('= 3:32')).toBeTruthy()
    // Título e canal sugeridos nos campos vazios.
    expect((screen.getByLabelText('Título do vídeo (opcional)') as HTMLInputElement).value).toBe('Aula de laços')
    expect((screen.getByLabelText('Canal (opcional)') as HTMLInputElement).value).toBe('Canal Sabiá')
  })

  it('não troca a duração já preenchida sozinho; o botão "Ler duração do vídeo" troca', async () => {
    render(<Video inicial={{ videoId: 'dQw4w9WgXcQ', duracaoSegundos: 100, titulo: 'Meu título' }} />)
    await esperarApi()
    const p = players[0]
    p.getDuration.mockReturnValue(212)
    p.pronto()
    expect(campoDuracao().value).toBe('100')
    expect((screen.getByLabelText('Título do vídeo (opcional)') as HTMLInputElement).value).toBe('Meu título')

    fireEvent.click(screen.getByRole('button', { name: 'Ler duração do vídeo' }))
    expect(campoDuracao().value).toBe('212')
  })

  it('duração que continua 0 pede para reproduzir e é lida no primeiro "reproduzindo", pausando', async () => {
    render(<Video inicial={{ videoId: 'dQw4w9WgXcQ' }} />)
    await esperarApi()
    const p = players[0]
    p.pronto()
    act(() => vi.advanceTimersByTime(5_000))
    expect(screen.getByText('Clique em reproduzir uma vez para a duração ser lida.')).toBeTruthy()

    p.getDuration.mockReturnValue(300)
    act(() => p.opcoes.events?.onStateChange?.({ target: p, data: 1 }))
    expect(campoDuracao().value).toBe('300')
    expect(p.pauseVideo).toHaveBeenCalledOnce()
    expect(screen.queryByText('Clique em reproduzir uma vez para a duração ser lida.')).toBeNull()
  })

  it('erro do player mostra a mensagem e a duração continua editável à mão', async () => {
    render(<Video inicial={{ videoId: 'dQw4w9WgXcQ' }} />)
    await esperarApi()
    act(() => players[0].opcoes.events?.onError?.({ target: players[0], data: 150 }))
    expect(screen.getByText(/não permite que ele seja exibido fora do YouTube/)).toBeTruthy()

    fireEvent.change(campoDuracao(), { target: { value: '95' } })
    expect(campoDuracao().value).toBe('95')
    expect(screen.getByText('O aluno precisará assistir pelo menos 1:07 (70%).')).toBeTruthy()
  })

  it('sem a API (offline) mostra aviso discreto e aceita a duração manual', async () => {
    carregar.mockRejectedValue(new Error('offline'))
    render(<Video inicial={{ videoId: 'dQw4w9WgXcQ' }} />)
    await esperarApi()
    expect(screen.getByText(/Não foi possível carregar o player do YouTube/)).toBeTruthy()
    fireEvent.change(campoDuracao(), { target: { value: '60' } })
    expect(campoDuracao().value).toBe('60')
  })

  it('link inválido mostra erro e não cria player', async () => {
    render(<Video />)
    fireEvent.change(campoLink(), { target: { value: 'https://evilyoutube.com/watch?v=dQw4w9WgXcQ' } })
    await esperarApi()
    expect(screen.getByText('Informe um link do YouTube válido (https) ou o id do vídeo.')).toBeTruthy()
    expect(players).toHaveLength(0)
    expect(carregar).not.toHaveBeenCalled()
  })

  it('destrói o player ao trocar de vídeo e ao desmontar', async () => {
    const { unmount } = render(<Video inicial={{ videoId: 'dQw4w9WgXcQ' }} />)
    await esperarApi()
    const primeiro = players[0]
    fireEvent.change(campoLink(), { target: { value: 'https://youtu.be/a-b_C1234Z9' } })
    await esperarApi()
    expect(primeiro.destroy).toHaveBeenCalledOnce()
    expect(players).toHaveLength(2)
    expect(players[1].opcoes.videoId).toBe('a-b_C1234Z9')

    unmount()
    expect(players[1].destroy).toHaveBeenCalledOnce()
  })

  it('página já salva (sugerirDados falso): abrir não sugere título nem canal e não chama onChange', async () => {
    const aoMudar = vi.fn()
    render(<Video inicial={{ videoId: 'dQw4w9WgXcQ', duracaoSegundos: 212 }} sugerirDados={false} aoMudar={aoMudar} />)
    await esperarApi()
    const p = players[0]
    p.getDuration.mockReturnValue(212)
    p.pronto()
    act(() => vi.advanceTimersByTime(1000))
    expect((screen.getByLabelText('Título do vídeo (opcional)') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText('Canal (opcional)') as HTMLInputElement).value).toBe('')
    expect(aoMudar).not.toHaveBeenCalled()
  })
})
