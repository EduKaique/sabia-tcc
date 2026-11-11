'use client'

import { CheckCircle2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { botaoSecundario, linkDiscreto, textoApoio } from '@/lib/estilos'

interface Props {
  videoId: string
  titulo: string | null
  canal: string | null
  visto: boolean
  marcando: boolean
  onMarcarVisto: () => void
}

/**
 * Vídeo do YouTube (modo privacidade aprimorada), já montado: use só na página do vídeo da etapa
 * de conteúdo. Sem IFrame API — "Já assisti" é uma ação explícita.
 */
export function VideoLicao({ videoId, titulo, canal, visto, marcando, onMarcarVisto }: Props) {
  const tituloVideo = titulo ?? 'Vídeo da lição'

  return (
    <section aria-label="Vídeo da lição" className="space-y-2">
      {/* 16:9 na largura do cartão; a largura máxima limita a altura a 100dvh − 28rem (navbar,
          atribuição e botões cabem numa tela de 1080p sem rolagem). Mínimo de 18rem no mobile. */}
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
        title={tituloVideo}
        referrerPolicy="strict-origin-when-cross-origin"
        allow="encrypted-media; picture-in-picture; fullscreen"
        className="mx-auto block aspect-video w-full max-w-[max(18rem,calc((100dvh_-_28rem)*16/9))] rounded-2xl border-2 border-tinta"
      />

      {(titulo || canal) && (
        <p className={textoApoio}>
          {titulo}
          {titulo && canal ? ' — ' : ''}
          {canal}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(linkDiscreto, 'gap-1 px-0 text-sm')}
        >
          Abrir no YouTube
          <ExternalLink size={14} aria-hidden="true" />
        </a>

        {visto ? (
          <span className="inline-flex items-center gap-1 text-sm font-bold text-tinta">
            <CheckCircle2 size={16} className="text-sabia-verde" aria-hidden="true" />
            Vídeo assistido
          </span>
        ) : (
          <button
            type="button"
            onClick={onMarcarVisto}
            disabled={marcando}
            className={cn(botaoSecundario, 'min-h-10 px-4 py-1.5 text-sm disabled:cursor-wait disabled:opacity-60')}
          >
            Já assisti
          </button>
        )}
      </div>
    </section>
  )
}
