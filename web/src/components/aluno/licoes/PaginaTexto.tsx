'use client'

import type { ConteudoTextoAluno, ProgressoPagina } from '@/types/licao'
import { HtmlLicao } from './HtmlLicao'
import { useAoAbrir } from './useAoAbrir'

interface Props {
  conteudo: ConteudoTextoAluno
  progresso: ProgressoPagina
  /** Registra a página como vista (chamado uma vez ao abrir, se ainda não concluída). */
  aoAbrir: () => void
}

export function PaginaTexto({ conteudo, progresso, aoAbrir }: Props) {
  useAoAbrir(progresso.concluida, aoAbrir)
  return <HtmlLicao html={conteudo.html} />
}
