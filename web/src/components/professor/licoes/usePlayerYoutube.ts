'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { ESTADO_PLAYER, carregarApiYoutube, type PlayerYoutube } from '@/lib/licoes/carregadorYoutube'

export type SituacaoPlayer = 'carregando' | 'pronto' | 'erro' | 'semApi'
export type OrigemDuracao = 'automatica' | 'manual'

interface Callbacks {
  /** Duração lida do player, em segundos inteiros (> 0). */
  aoLerDuracao: (segundos: number, origem: OrigemDuracao) => void
  /** Título e canal do vídeo, quando o player informar. */
  aoLerDados?: (dados: { titulo?: string; canal?: string }) => void
}

export const TITULO_PLAYER = 'Pré-visualização do vídeo do YouTube'
const INTERVALO_MS = 250
const ESPERA_MAX_MS = 5_000

function mensagemDoErro(codigo: number | undefined): string {
  if (codigo === 101 || codigo === 150) {
    return 'O dono deste vídeo não permite que ele seja exibido fora do YouTube. Escolha outro vídeo ou informe a duração à mão.'
  }
  if (codigo === 2 || codigo === 100) {
    return 'Este vídeo não foi encontrado ou está indisponível. Confira o link; a duração pode ser informada à mão.'
  }
  return 'Não foi possível exibir o vídeo. A duração pode ser informada à mão.'
}

function duracaoDe(player: PlayerYoutube): number {
  try {
    const d = Math.round(player.getDuration())
    return Number.isFinite(d) && d > 0 ? d : 0
  } catch {
    return 0
  }
}

/**
 * Player do YouTube (IFrame API, host youtube-nocookie) dentro de `containerRef`, para um único `videoId`: para
 * trocar de vídeo, remonte o componente (key). Ao ficar pronto, tenta ler a duração por até 5 s; se o YouTube
 * ainda não souber (0), espera o primeiro "reproduzindo", lê e pausa. O player é destruído ao desmontar.
 */
export function usePlayerYoutube(videoId: string, containerRef: RefObject<HTMLElement | null>, callbacks: Callbacks) {
  const [situacao, setSituacao] = useState<SituacaoPlayer>('carregando')
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)
  const [aguardandoPlay, setAguardandoPlay] = useState(false)

  const callbacksRef = useRef(callbacks)
  useEffect(() => {
    callbacksRef.current = callbacks
  })
  const playerRef = useRef<PlayerYoutube | null>(null)
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null)
  /** Origem da leitura que espera o primeiro "reproduzindo" (null: nenhuma). */
  const esperaPlayRef = useRef<OrigemDuracao | null>(null)

  const pararTentativas = useCallback(() => {
    if (intervaloRef.current) clearInterval(intervaloRef.current)
    intervaloRef.current = null
  }, [])

  const lerDuracao = useCallback(
    (origem: OrigemDuracao = 'manual') => {
      const player = playerRef.current
      if (!player) return
      pararTentativas()
      esperaPlayRef.current = null
      setAguardandoPlay(false)
      const tentar = () => {
        const d = duracaoDe(player)
        if (d > 0) {
          pararTentativas()
          callbacksRef.current.aoLerDuracao(d, origem)
        }
        return d > 0
      }
      if (tentar()) return
      let decorrido = 0
      intervaloRef.current = setInterval(() => {
        decorrido += INTERVALO_MS
        if (tentar() || decorrido < ESPERA_MAX_MS) return
        pararTentativas()
        esperaPlayRef.current = origem
        setAguardandoPlay(true)
      }, INTERVALO_MS)
    },
    [pararTentativas]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelado = false

    carregarApiYoutube()
      .then((YT) => {
        if (cancelado) return
        const alvo = document.createElement('div')
        container.appendChild(alvo)
        playerRef.current = new YT.Player(alvo, {
          host: 'https://www.youtube-nocookie.com',
          videoId,
          width: '100%',
          height: '100%',
          playerVars: { rel: 0, playsinline: 1 },
          events: {
            onReady: (e) => {
              if (cancelado) return
              try {
                e.target.getIframe?.()?.setAttribute('title', TITULO_PLAYER)
              } catch {
                // sem iframe acessível: o contêiner já tem aria-label
              }
              try {
                const dados = e.target.getVideoData?.()
                if (dados && (dados.title || dados.author)) {
                  callbacksRef.current.aoLerDados?.({ titulo: dados.title || undefined, canal: dados.author || undefined })
                }
              } catch {
                // getVideoData não faz parte da API documentada: é só uma sugestão
              }
              setSituacao('pronto')
              lerDuracao('automatica')
            },
            onStateChange: (e) => {
              if (cancelado || e.data !== ESTADO_PLAYER.REPRODUZINDO || !esperaPlayRef.current) return
              const d = duracaoDe(e.target)
              if (d === 0) return
              const origem = esperaPlayRef.current
              esperaPlayRef.current = null
              setAguardandoPlay(false)
              callbacksRef.current.aoLerDuracao(d, origem)
              try {
                e.target.pauseVideo()
              } catch {
                // pausar é cortesia
              }
            },
            onError: (e) => {
              if (cancelado) return
              pararTentativas()
              esperaPlayRef.current = null
              setAguardandoPlay(false)
              setSituacao('erro')
              setMensagemErro(mensagemDoErro(e.data))
            },
          },
        })
      })
      .catch(() => {
        if (!cancelado) setSituacao('semApi')
      })

    return () => {
      cancelado = true
      pararTentativas()
      esperaPlayRef.current = null
      try {
        playerRef.current?.destroy()
      } catch {
        // o player pode já ter sido removido
      }
      playerRef.current = null
      container.replaceChildren()
    }
  }, [videoId, containerRef, lerDuracao, pararTentativas])

  return { situacao, mensagemErro, aguardandoPlay, lerDuracao: () => lerDuracao('manual') }
}
