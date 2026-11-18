import { describe, expect, it } from 'vitest'
import { metadadosLicaoSchema, paginaImagemSchema, paginaTextoSchema, urlHttps } from './licaoSchema'

const meta = (titulo: string, conceito = 'Tema', resumo = '') =>
  metadadosLicaoSchema.safeParse({ titulo, conceito, resumo }).success
const texto = (html: string, titulo = '') => paginaTextoSchema.safeParse({ titulo, html }).success
const imagem = (campos: Partial<Record<'imagemUrl' | 'alt' | 'legenda' | 'html' | 'titulo', string>>) =>
  paginaImagemSchema.safeParse({ titulo: '', imagemUrl: 'https://x.org/a.png', alt: 'A', legenda: '', html: '', ...campos })
    .success

describe('licaoSchema', () => {
  it('título de 3 a 255 caracteres (aparado)', () => {
    expect(meta('ab')).toBe(false)
    expect(meta('abc')).toBe(true)
    expect(meta('  ab  ')).toBe(false)
    expect(meta('a'.repeat(255))).toBe(true)
    expect(meta('a'.repeat(256))).toBe(false)
  })

  it('tema obrigatório até 255 e descrição até 2000', () => {
    expect(meta('Laços', '   ')).toBe(false)
    expect(meta('Laços', 'a'.repeat(255))).toBe(true)
    expect(meta('Laços', 'a'.repeat(256))).toBe(false)
    expect(meta('Laços', 'Tema', 'a'.repeat(2000))).toBe(true)
    expect(meta('Laços', 'Tema', 'a'.repeat(2001))).toBe(false)
  })

  it('texto obrigatório até 20000 e título da página até 150', () => {
    expect(texto('<p></p>')).toBe(false)
    const html = (n: number) => `<p>${'a'.repeat(n - 7)}</p>`
    expect(texto(html(20_000))).toBe(true)
    expect(texto(html(20_001))).toBe(false)
    expect(texto('<p>a</p>', 'a'.repeat(150))).toBe(true)
    expect(texto('<p>a</p>', 'a'.repeat(151))).toBe(false)
  })

  it('imagem: https até 500, alt obrigatório até 200, legenda até 200, html até 10000', () => {
    expect(imagem({ imagemUrl: 'http://x.org/a.png' })).toBe(false)
    expect(imagem({ imagemUrl: 'javascript:alert(1)' })).toBe(false)
    expect(imagem({ imagemUrl: '' })).toBe(false)
    const url = (n: number) => `https://x.org/${'a'.repeat(n - 14)}`
    expect(url(500)).toHaveLength(500)
    expect(imagem({ imagemUrl: url(500) })).toBe(true)
    expect(imagem({ imagemUrl: url(501) })).toBe(false)
    expect(imagem({ alt: '  ' })).toBe(false)
    expect(imagem({ alt: 'a'.repeat(200) })).toBe(true)
    expect(imagem({ alt: 'a'.repeat(201) })).toBe(false)
    expect(imagem({ legenda: 'a'.repeat(200) })).toBe(true)
    expect(imagem({ legenda: 'a'.repeat(201) })).toBe(false)
    expect(imagem({ html: 'a'.repeat(10_000) })).toBe(true)
    expect(imagem({ html: 'a'.repeat(10_001) })).toBe(false)
  })

  it('urlHttps exige host e recusa espaços', () => {
    expect(urlHttps('https://exemplo.org/x.png')).toBe(true)
    expect(urlHttps('https://exemplo.org/a b.png')).toBe(false)
  })
})
