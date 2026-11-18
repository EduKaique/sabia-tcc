import { cn } from '@/lib/utils'
import { sanitizarConteudoLicao } from '@/lib/sanitizarHtml'
import { ESTILO_CONTEUDO_LICAO } from '@/components/professor/licoes/PreviaHtml'

/** HTML de página de lição, sanitizado pela regra restrita das lições, no tamanho de leitura do aluno. */
export function HtmlLicao({ html }: { html: string | undefined }) {
  const limpo = sanitizarConteudoLicao(html)
  if (!limpo) return null
  return (
    <div
      className={cn(ESTILO_CONTEUDO_LICAO, 'text-lg text-tinta sm:text-xl [&_h2]:text-2xl [&_h3]:text-xl')}
      dangerouslySetInnerHTML={{ __html: limpo }}
    />
  )
}
