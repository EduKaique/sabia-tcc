import DOMPurify from 'dompurify'

/**
 * Remove scripts, handlers on* e afins de HTML vindo da API (descrição da atividade,
 * escrita pelo professor no editor rico) antes de usar em dangerouslySetInnerHTML.
 * O DOMPurify precisa de DOM: no servidor devolve vazio (esses dados só chegam no cliente).
 */
export function sanitizarHtml(html: string | null | undefined): string {
  if (!html || typeof window === 'undefined') return ''
  return DOMPurify.sanitize(html)
}
