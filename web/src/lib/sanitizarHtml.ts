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

const TAGS_DESCRICAO = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'code']

/**
 * Versão restrita para descrições de atividade: só a formatação do editor do professor.
 * Links abrem em nova aba com rel="noopener noreferrer".
 */
export function sanitizarDescricao(html: string | null | undefined): string {
  if (!html || typeof window === 'undefined') return ''
  const fragmento = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: TAGS_DESCRICAO,
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    RETURN_DOM_FRAGMENT: true,
  })
  fragmento.querySelectorAll('a').forEach((link) => {
    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noopener noreferrer')
  })
  const wrapper = document.createElement('div')
  wrapper.appendChild(fragmento)
  return wrapper.innerHTML
}
