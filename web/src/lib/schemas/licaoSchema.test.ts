import { describe, expect, it } from 'vitest'
import type { EstadoEditor } from '@/lib/licoes/editorLicao'
import {
  chaveDoCaminho,
  metadadosLicaoSchema,
  paginaImagemSchema,
  paginaQuestionarioSchema,
  paginaTextoSchema,
  paginaVideoSchema,
  urlHttps,
  validarLicaoEditor,
} from './licaoSchema'

const meta = (titulo: string, conceito = 'Tema', resumo = '') =>
  metadadosLicaoSchema.safeParse({ titulo, conceito, resumo }).success
const texto = (html: string, titulo = '') => paginaTextoSchema.safeParse({ titulo, html }).success
const imagem = (campos: Partial<Record<'imagemUrl' | 'alt' | 'legenda' | 'html' | 'titulo', string>>) =>
  paginaImagemSchema.safeParse({ titulo: '', imagemUrl: 'https://x.org/a.png', alt: 'A', legenda: '', html: '', ...campos })
    .success

const video = (campos: Record<string, unknown>) =>
  paginaVideoSchema.safeParse({ titulo: '', videoId: 'dQw4w9WgXcQ', tituloVideo: '', canal: '', ...campos }).success
const pergunta = (campos: Record<string, unknown> = {}) => ({
  enunciado: 'Pergunta?',
  alternativas: ['a', 'b'],
  correta: 0,
  ...campos,
})
const questionario = (campos: Record<string, unknown>) =>
  paginaQuestionarioSchema.safeParse({ titulo: '', percentualMinimo: 70, perguntas: [pergunta()], ...campos })

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
    const png = 'data:image/png;base64,iVBORw0KGgo='
    expect(imagem({ imagemUrl: png })).toBe(true)
    expect(imagem({ imagemUrl: `data:image/png;base64,${'A'.repeat(20_000 - 22)}` })).toBe(true)
    expect(imagem({ imagemUrl: `data:image/png;base64,${'A'.repeat(20_000)}` })).toBe(false)
    expect(imagem({ imagemUrl: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' })).toBe(false)
    expect(imagem({ imagemUrl: 'data:text/html;base64,PGI+PC9iPg==' })).toBe(false)
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

  it('vídeo: link ou id válido, duração inteira de 10 a 10800 (opcional), título e canal até 255', () => {
    expect(video({})).toBe(true)
    expect(video({ videoId: 'https://youtu.be/dQw4w9WgXcQ' })).toBe(true)
    expect(video({ videoId: '' })).toBe(false)
    expect(video({ videoId: 'http://youtu.be/dQw4w9WgXcQ' })).toBe(false)
    expect(video({ videoId: 'dQw4w9WgXc' })).toBe(false)
    expect(video({ videoId: 'https://youtu.be/dQw4w9WgXcQ?x=' + 'a'.repeat(500) })).toBe(false)
    expect(video({ duracaoSegundos: undefined })).toBe(true)
    expect(video({ duracaoSegundos: '' })).toBe(true)
    expect(video({ duracaoSegundos: 9 })).toBe(false)
    expect(video({ duracaoSegundos: 10 })).toBe(true)
    expect(video({ duracaoSegundos: '10800' })).toBe(true)
    expect(video({ duracaoSegundos: 10_801 })).toBe(false)
    expect(video({ duracaoSegundos: '12.5' })).toBe(false)
    expect(video({ duracaoSegundos: 'dez' })).toBe(false)
    expect(video({ tituloVideo: 'a'.repeat(255), canal: 'c'.repeat(255) })).toBe(true)
    expect(video({ tituloVideo: 'a'.repeat(256) })).toBe(false)
    expect(video({ canal: 'c'.repeat(256) })).toBe(false)
  })

  it('questionário: enunciado até 500, alternativas 2 a 5 até 200, 1 a 10 perguntas, percentual 0 a 100', () => {
    expect(questionario({}).success).toBe(true)
    expect(questionario({ perguntas: [pergunta({ enunciado: 'a'.repeat(500) })] }).success).toBe(true)
    expect(questionario({ perguntas: [pergunta({ enunciado: 'a'.repeat(501) })] }).success).toBe(false)
    expect(questionario({ perguntas: [pergunta({ enunciado: '  ' })] }).success).toBe(false)
    expect(questionario({ perguntas: [pergunta({ alternativas: ['a'.repeat(200), 'b'] })] }).success).toBe(true)
    expect(questionario({ perguntas: [pergunta({ alternativas: ['a'.repeat(201), 'b'] })] }).success).toBe(false)
    expect(questionario({ perguntas: [pergunta({ alternativas: [' ', 'b'] })] }).success).toBe(false)
    expect(questionario({ perguntas: [pergunta({ alternativas: ['a'] })] }).success).toBe(false)
    expect(questionario({ perguntas: [pergunta({ alternativas: ['a', 'b', 'c', 'd', 'e'] })] }).success).toBe(true)
    expect(questionario({ perguntas: [pergunta({ alternativas: ['a', 'b', 'c', 'd', 'e', 'f'] })] }).success).toBe(false)
    expect(questionario({ perguntas: [] }).success).toBe(false)
    expect(questionario({ perguntas: Array.from({ length: 10 }, () => pergunta()) }).success).toBe(true)
    expect(questionario({ perguntas: Array.from({ length: 11 }, () => pergunta()) }).success).toBe(false)
    expect(questionario({ percentualMinimo: -1 }).success).toBe(false)
    expect(questionario({ percentualMinimo: 0 }).success).toBe(true)
    expect(questionario({ percentualMinimo: 100 }).success).toBe(true)
    expect(questionario({ percentualMinimo: 101 }).success).toBe(false)
    expect(questionario({ percentualMinimo: 70.5 }).success).toBe(false)
    expect(questionario({ percentualMinimo: null }).success).toBe(false)
  })

  it('questionário: correta nula pede a alternativa certa, com a chave do servidor', () => {
    const r = questionario({ perguntas: [pergunta(), pergunta({ correta: null })] })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0].message).toBe('Escolha a alternativa certa.')
      expect(chaveDoCaminho(r.error.issues[0].path)).toBe('perguntas[1].correta')
    }
  })

  it('validarLicaoEditor usa as chaves do servidor nos subcaminhos (e "tituloVideo" para o título do vídeo)', () => {
    const estado = {
      metadados: { titulo: 'Laços', conceito: 'Tema', resumo: '' },
      paginas: [
        { chave: 'n-1', tipo: 'VIDEO_YOUTUBE', titulo: '', conteudo: { videoId: 'x', titulo: 'a'.repeat(256), duracaoSegundos: '9' } },
        {
          chave: 'n-2',
          tipo: 'QUESTIONARIO',
          titulo: '',
          conteudo: { percentualMinimo: 70, perguntas: [{ enunciado: 'e', alternativas: ['a', ''], correta: null }] },
        },
        { chave: 's-3', id: 3, tipo: 'VIDEO_UPLOAD', titulo: '', conteudo: {} },
      ],
    } as unknown as EstadoEditor
    const v = validarLicaoEditor(estado)
    expect(v.ok).toBe(false)
    expect(Object.keys(v.paginas['n-1']).sort()).toEqual(['duracaoSegundos', 'tituloVideo', 'videoId'])
    expect(Object.keys(v.paginas['n-2']).sort()).toEqual(['perguntas[0].alternativas[1]', 'perguntas[0].correta'])
    expect(v.paginas['s-3']).toBeUndefined()
  })
})
