'use client'

import { cn } from '@/lib/utils'
import { sanitizarDescricao } from '@/lib/sanitizarHtml'

interface Props {
  html: string | null | undefined
  className?: string
}

const TEM_TAG = /<[a-z][\s\S]*>/i

/**
 * Exibe HTML do editor rico (sanitizado). Texto puro legado é mostrado escapado, com quebras de
 * linha preservadas. O wrapper é sempre `div`, pois o conteúdo já traz `<p>`.
 */
export function HtmlContent({ html, className }: Props) {
  if (!html || !TEM_TAG.test(html)) {
    return <div className={cn('whitespace-pre-line', className)}>{html}</div>
  }
  return (
    <div
      className={cn('html-content', className)}
      dangerouslySetInnerHTML={{ __html: sanitizarDescricao(html) }}
    />
  )
}
