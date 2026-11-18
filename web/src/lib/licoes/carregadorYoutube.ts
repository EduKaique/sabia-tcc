/**
 * Carregador sob demanda da YouTube IFrame API (https://www.youtube.com/iframe_api), sem dependência nova.
 * Uma única promessa para todos os players; se o script falhar, a promessa é descartada e a próxima chamada
 * tenta de novo. Tipagem mínima local (só o que o editor usa).
 */

export const URL_IFRAME_API = 'https://www.youtube.com/iframe_api'
const TEMPO_LIMITE_MS = 15_000

/** Estados do player usados aqui (YT.PlayerState). */
export const ESTADO_PLAYER = { REPRODUZINDO: 1 } as const

export interface PlayerYoutube {
  getDuration(): number
  getVideoData?(): { title?: string; author?: string; video_id?: string }
  getIframe?(): HTMLIFrameElement
  pauseVideo(): void
  destroy(): void
}

export interface EventoPlayer {
  target: PlayerYoutube
  data?: number
}

export interface OpcoesPlayer {
  host?: string
  videoId: string
  width?: string | number
  height?: string | number
  playerVars?: Record<string, string | number>
  events?: {
    onReady?: (e: EventoPlayer) => void
    onStateChange?: (e: EventoPlayer) => void
    onError?: (e: EventoPlayer) => void
  }
}

export interface ApiYoutube {
  Player: new (alvo: HTMLElement, opcoes: OpcoesPlayer) => PlayerYoutube
}

declare global {
  interface Window {
    YT?: Partial<ApiYoutube>
    onYouTubeIframeAPIReady?: () => void
  }
}

let promessa: Promise<ApiYoutube> | null = null

/** Carrega a API uma vez e devolve o namespace `YT`. Rejeita no servidor (SSR), em falha de rede ou após 15 s. */
export function carregarApiYoutube(): Promise<ApiYoutube> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('A API do YouTube só carrega no navegador.'))
  }
  if (window.YT?.Player) return Promise.resolve(window.YT as ApiYoutube)
  if (promessa) return promessa

  promessa = new Promise<ApiYoutube>((resolve, reject) => {
    const script = document.createElement('script')
    let encerrado = false
    const falhar = (motivo: string) => {
      if (encerrado) return
      encerrado = true
      clearTimeout(limite)
      promessa = null
      script.remove()
      reject(new Error(motivo))
    }
    const limite = setTimeout(() => falhar('A API do YouTube demorou demais para carregar.'), TEMPO_LIMITE_MS)

    const anterior = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      anterior?.()
      if (encerrado) return
      if (!window.YT?.Player) {
        falhar('A API do YouTube carregou sem o player.')
        return
      }
      encerrado = true
      clearTimeout(limite)
      resolve(window.YT as ApiYoutube)
    }

    script.src = URL_IFRAME_API
    script.async = true
    script.onerror = () => falhar('Não foi possível carregar a API do YouTube.')
    document.head.appendChild(script)
  })
  return promessa
}
