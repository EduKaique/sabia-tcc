'use client'

import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { textoApoio } from '@/lib/estilos'
import type { ConteudoImagemTextoAluno, ProgressoPagina } from '@/types/licao'
import { HtmlLicao } from './HtmlLicao'
import { useAoAbrir } from './useAoAbrir'

interface Props {
  conteudo: ConteudoImagemTextoAluno
  progresso: ProgressoPagina
  aoAbrir: () => void
}

export function PaginaImagem({ conteudo, progresso, aoAbrir }: Props) {
  useAoAbrir(progresso.concluida, aoAbrir)
  const [falhou, setFalhou] = useState(false)

  return (
    <div className="space-y-5">
      <figure className="space-y-2">
        {falhou ? (
          <div className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-tinta/30 p-4 text-base text-tinta-apoio">
            <ImageOff size={20} aria-hidden="true" />
            Não foi possível carregar a imagem. ({conteudo.alt})
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- imagem externa informada pelo professor
          <img
            src={conteudo.imagemUrl}
            alt={conteudo.alt}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="mx-auto max-h-[60vh] w-auto max-w-full rounded-2xl border-2 border-tinta/15"
            onError={() => setFalhou(true)}
          />
        )}
        {conteudo.legenda && <figcaption className={`${textoApoio} text-center`}>{conteudo.legenda}</figcaption>}
      </figure>
      <HtmlLicao html={conteudo.html} />
    </div>
  )
}
