// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { sanitizarConteudoLicao } from './sanitizarHtml'

describe('sanitizarConteudoLicao', () => {
  it('remove script, style, img, iframe, form e handlers', () => {
    const limpo = sanitizarConteudoLicao(
      '<p onclick="x()">Oi</p><script>alert(1)</script><style>p{}</style><img src="x" onerror="alert(1)">' +
        '<iframe src="https://x.org"></iframe><form><input></form><p style="color:red">cor</p>'
    )
    expect(limpo).toBe('<p>Oi</p><p>cor</p>')
  })

  it('mantém títulos, listas, ênfase, código, citação e linha', () => {
    const html =
      '<h2>T</h2><h3>S</h3><ul><li><strong>a</strong></li></ul><ol><li><em>b</em></li></ol>' +
      '<p><u>c</u> <code>d</code></p><blockquote>e</blockquote><hr>'
    expect(sanitizarConteudoLicao(html)).toBe(html)
  })

  it('remove h1 e tags fora da lista mantendo o texto', () => {
    expect(sanitizarConteudoLicao('<h1>Grande</h1><div><span>x</span></div>')).toBe('Grandex')
  })

  it('links: só http, https e mailto, sempre em nova aba com rel seguro', () => {
    expect(sanitizarConteudoLicao('<a href="https://x.org" target="_self" rel="opener">x</a>')).toBe(
      '<a href="https://x.org" target="_blank" rel="noopener noreferrer">x</a>'
    )
    expect(sanitizarConteudoLicao('<a href="mailto:a@b.org">m</a>')).toContain('href="mailto:a@b.org"')
    expect(sanitizarConteudoLicao('<a href="javascript:alert(1)">j</a>')).not.toContain('javascript')
    expect(sanitizarConteudoLicao('<a href="data:text/html,x">d</a>')).not.toContain('data:')
  })

  it('vazio devolve vazio', () => {
    expect(sanitizarConteudoLicao('')).toBe('')
    expect(sanitizarConteudoLicao(null)).toBe('')
  })
})
