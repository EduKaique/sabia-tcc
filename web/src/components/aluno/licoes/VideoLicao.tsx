'use client'

import { useState } from 'react'
import { CheckCircle2, ExternalLink, Play } from 'lucide-react'
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
 * Vídeo do YouTube (modo privacidade aprimorada). O iframe só é montado depois do clique: nada é
 * carregado do YouTube até o aluno pedir. Sem IFrame API — "Já assisti" é uma ação explícita.
 */
export function VideoLicao({ videoId, titulo, canal, visto, marcando, onMarcarVisto }: Props) {
  const [aberto, setAberto] = useState(false)
  const tituloVideo = titulo ?? 'Vídeo da lição'

  return (
    <section aria-label="Vídeo da lição" className="space-y-2">
      {aberto ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          title={tituloVideo}
          referrerPolicy="strict-origin-when-cross-origin"
          allow="encrypted-media; picture-in-picture; fullscreen"
          className="aspect-video w-full rounded-2xl border-2 border-tinta"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className={cn(botaoSecundario, 'w-full')}
        >
          <Play size={16} className="fill-current" aria-hidden="true" />
          Assistir vídeo
        </button>
      )}

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
