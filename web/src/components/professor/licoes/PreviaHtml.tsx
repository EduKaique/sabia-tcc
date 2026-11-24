'use client'

import { sanitizarConteudoLicao } from '@/lib/sanitizarHtml'

/** Estilo do HTML de lição (mesmas tags da lista branca de sanitizarConteudoLicao). */
export const ESTILO_CONTEUDO_LICAO =
  'text-sm leading-relaxed text-foreground [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold ' +
  '[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc ' +
  '[&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-primary [&_a]:underline ' +
  '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_blockquote]:border-l-4 [&_blockquote]:pl-3 ' +
  '[&_blockquote]:text-muted-foreground [&_hr]:my-4'

/** Pré-visualização do texto como o aluno vai ver (HTML sanitizado pela regra restrita das lições). */
export function PreviaHtml({ html }: { html: string }) {
  const limpo = sanitizarConteudoLicao(html)
  if (!limpo) return <p className="text-sm text-muted-foreground">Nada para mostrar ainda.</p>
  return <div className={ESTILO_CONTEUDO_LICAO} dangerouslySetInnerHTML={{ __html: limpo }} />
}
