'use client'

import { useEffect, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { CheckCircle2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { alertaErro, botaoSecundario, textoApoio } from '@/lib/estilos'
import { progressoVideo } from '@/lib/licoes/aluno'
import { criarAgendaPulsos, type ResultadoPulso } from '@/lib/licoes/agendaPulsos'
import { carregarApiYoutube, type PlayerYoutube } from '@/lib/licoes/carregadorYoutube'
import type { ConteudoVideoAluno, ProgressoPagina, PulsoVideo } from '@/types/licao'

interface Props {
  conteudo: ConteudoVideoAluno
  progresso: ProgressoPagina
  /** Envia um pulso e devolve a resposta do servidor (que também atualiza o progresso recebido aqui). */
  enviarPulso: () => Promise<PulsoVideo>
}

/** Estados do player (YT.PlayerState) que interessam aos pulsos. */
const TERMINADO = 0
const REPRODUZINDO = 1
const PAUSADO = 2

const TITULO_PLAYER = 'Vídeo da lição'

function mensagemDoErro(codigo: number | undefined): string {
  if (codigo === 101 || codigo === 150) {
    return 'Este vídeo não pode ser exibido aqui. Avise seu professor.'
  }
  if (codigo === 2 || codigo === 100) {
    return 'Este vídeo não foi encontrado ou está indisponível. Avise seu professor.'
  }
  return 'Não foi possível mostrar o vídeo.'
}

/** Página de vídeo. "Tentar de novo" remonta o player (o carregador da API tenta de novo após uma falha). */
export function PaginaVideo(props: Props) {
  const [tentativa, setTentativa] = useState(0)
  return <PlayerAluno key={tentativa} {...props} aoTentarDeNovo={() => setTentativa((t) => t + 1)} />
}

type Situacao = 'carregando' | 'pronto' | 'erro' | 'semApi'

function PlayerAluno({ conteudo, progresso, enviarPulso, aoTentarDeNovo }: Props & { aoTentarDeNovo: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [situacao, setSituacao] = useState<Situacao>('carregando')
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)
  const [avisoPulso, setAvisoPulso] = useState<string | null>(null)

  const enviarPulsoRef = useRef(enviarPulso)
  useEffect(() => {
    enviarPulsoRef.current = enviarPulso
  })
  // Decidido na montagem: sem duração cadastrada (sem progresso de vídeo) ou já conferido, não há pulsos.
  const [contaPulsos] = useState(() => !!progresso.video && !progresso.video.conferido)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelado = false
    let player: PlayerYoutube | null = null

    const agenda = contaPulsos
      ? criarAgendaPulsos(async (): Promise<ResultadoPulso> => {
          try {
            const r = await enviarPulsoRef.current()
            return r.conferido ? 'conferido' : 'ok'
          } catch (e) {
            const status = isAxiosError(e) ? e.response?.status : undefined
            if (status === 404 || status === 422) {
              if (!cancelado) setAvisoPulso('Não foi possível registrar o tempo assistido nesta página. Avise seu professor.')
              return 'parar'
            }
            // Rede ou servidor: tenta de novo no próximo pulso, sem interromper o vídeo.
            return 'erro'
          }
        })
      : null

    carregarApiYoutube()
      .then((YT) => {
        if (cancelado) return
        const alvo = document.createElement('div')
        container.appendChild(alvo)
        player = new YT.Player(alvo, {
          host: 'https://www.youtube-nocookie.com',
          videoId: conteudo.videoId,
          width: '100%',
          height: '100%',
          playerVars: { rel: 0, playsinline: 1 },
          events: {
            onReady: (e) => {
              if (cancelado) return
              try {
                const iframe = e.target.getIframe?.()
                iframe?.setAttribute('title', conteudo.titulo ?? TITULO_PLAYER)
                iframe?.setAttribute('aria-label', conteudo.titulo ?? TITULO_PLAYER)
              } catch {
                // sem iframe acessível: o contêiner já tem aria-label
              }
              setSituacao('pronto')
            },
            onStateChange: (e) => {
              if (cancelado || !agenda) return
              if (e.data === REPRODUZINDO) agenda.tocando()
              else if (e.data === PAUSADO) agenda.pausado()
              else if (e.data === TERMINADO) agenda.terminou()
            },
            onError: (e) => {
              if (cancelado) return
              agenda?.pausado()
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
      agenda?.encerrar()
      try {
        player?.destroy()
      } catch {
        // o player pode já ter sido removido
      }
      container.replaceChildren()
    }
  }, [conteudo.videoId, conteudo.titulo, contaPulsos])

  const resumo = progresso.video ? progressoVideo(progresso.video) : null
  const falhou = situacao === 'erro' || situacao === 'semApi'

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        role="region"
        aria-label={conteudo.titulo ?? TITULO_PLAYER}
        className={cn(
          'mx-auto aspect-video w-full max-w-[max(18rem,calc((100dvh_-_28rem)*16/9))] overflow-hidden rounded-2xl border-2 border-tinta bg-tinta/5',
          '[&>iframe]:h-full [&>iframe]:w-full',
          falhou && 'hidden'
        )}
      />

      {falhou && (
        <div role="alert" className={cn(alertaErro, 'space-y-3')}>
          <p>
            {situacao === 'semApi'
              ? 'Não conseguimos carregar o vídeo. Confira sua internet; se a escola bloqueia o YouTube, avise seu professor.'
              : mensagemErro}
          </p>
          <button type="button" onClick={aoTentarDeNovo} className={botaoSecundario}>
            <RotateCcw size={16} aria-hidden="true" />
            Tentar de novo
          </button>
        </div>
      )}

      {(conteudo.titulo || conteudo.canal) && (
        <p className={textoApoio}>
          {conteudo.titulo}
          {conteudo.titulo && conteudo.canal ? ' — ' : ''}
          {conteudo.canal}
        </p>
      )}

      {resumo ? (
        <div className="space-y-1.5">
          {resumo.conferido ? (
            <p className="inline-flex items-center gap-2 rounded-full border-2 border-sabia-verde bg-sabia-verde/15 px-3 py-1 text-base font-bold text-tinta">
              <CheckCircle2 size={18} className="text-sabia-verde" aria-hidden="true" />
              Vídeo concluído
            </p>
          ) : (
            <>
              <p className="text-base font-bold text-tinta" aria-live="polite">
                Você assistiu {resumo.assistido} de {resumo.necessario}
              </p>
              <div
                role="progressbar"
                aria-label="Tempo de vídeo assistido"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={resumo.percentual}
                className="h-3 w-full overflow-hidden rounded-full border-2 border-tinta bg-white"
              >
                <div className="h-full bg-sabia-azul transition-[width]" style={{ width: `${resumo.percentual}%` }} />
              </div>
              <p className={textoApoio}>Mantenha esta aba aberta enquanto assiste.</p>
            </>
          )}
        </div>
      ) : (
        <p className={textoApoio}>Este vídeo ainda não está pronto para contar o tempo assistido. Avise seu professor.</p>
      )}

      {avisoPulso && <p className={alertaErro}>{avisoPulso}</p>}
    </div>
  )
}
