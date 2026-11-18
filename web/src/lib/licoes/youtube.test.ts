import { describe, expect, it } from 'vitest'
import { extrairIdYoutube, formatarDuracao, lerDuracao, segundosNecessarios } from './youtube'

const ID = 'dQw4w9WgXcQ'

/**
 * Cópia literal da tabela de YoutubeUrlTest.extraiOuRecusa (pedagogico-service): as mesmas 34 linhas, com o
 * resultado esperado de cada uma (null = recusado).
 */
const TABELA_DO_SERVIDOR: [string, string | null][] = [
  // aceitos
  ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ['https://youtube.com/watch?feature=share&v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ['https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=RD123', 'dQw4w9WgXcQ'],
  ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ['https://youtu.be/dQw4w9WgXcQ?si=abc123&t=42', 'dQw4w9WgXcQ'],
  ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ['https://www.youtube.com/embed/dQw4w9WgXcQ?start=10', 'dQw4w9WgXcQ'],
  ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ['https://www.youtube.com/live/dQw4w9WgXcQ?feature=share', 'dQw4w9WgXcQ'],
  ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ['https://youtube-nocookie.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ['https://WWW.YOUTUBE.COM/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ['dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ['a-b_C1234Z9', 'a-b_C1234Z9'],
  // recusados
  ['http://www.youtube.com/watch?v=dQw4w9WgXcQ', null],
  ['http://youtu.be/dQw4w9WgXcQ', null],
  ['ftp://youtube.com/watch?v=dQw4w9WgXcQ', null],
  ['https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ', null],
  ['https://evilyoutube.com/watch?v=dQw4w9WgXcQ', null],
  ['https://youtube.com@evil.com/watch?v=dQw4w9WgXcQ', null],
  ['https://www.youtube.com:8443/watch?v=dQw4w9WgXcQ', null],
  ['https://www.youtube.com/watch?v=dQw4w9WgXc', null],
  ['https://www.youtube.com/watch?v=dQw4w9WgXcQQ', null],
  ['https://www.youtube.com/watch?v=dQw4w9WgX!Q', null],
  ['https://youtu.be/dQw4w9WgXc', null],
  ['https://youtu.be/', null],
  ['https://www.youtube.com/watch', null],
  ['https://www.youtube.com/channel/dQw4w9WgXcQ', null],
  ['https://www.youtube.com/embed/dQw4w9WgXcQ/extra', null],
  ['dQw4w9WgXc', null],
  ['dQw4w9WgXcQQ', null],
  ['dQw4w9Wg$cQ', null],
  ['javascript:alert(1)', null],
]

describe('extrairIdYoutube', () => {
  it('a tabela tem as 34 linhas do teste do servidor', () => {
    expect(TABELA_DO_SERVIDOR).toHaveLength(34)
  })

  it.each(TABELA_DO_SERVIDOR)('%s -> %s', (entrada, esperado) => {
    expect(extrairIdYoutube(entrada)).toBe(esperado)
  })

  it('vazio, nulo e espaços são recusados; id com espaços nas pontas é aparado', () => {
    expect(extrairIdYoutube(null)).toBeNull()
    expect(extrairIdYoutube(undefined)).toBeNull()
    expect(extrairIdYoutube('')).toBeNull()
    expect(extrairIdYoutube('   ')).toBeNull()
    expect(extrairIdYoutube(`  ${ID}  `)).toBe(ID)
  })

  it('porta explícita, mesmo a 443, é recusada como no servidor', () => {
    expect(extrairIdYoutube(`https://www.youtube.com:443/watch?v=${ID}`)).toBeNull()
  })
})

describe('duração', () => {
  it('formata em m:ss e, a partir de 1 h, em h:mm:ss', () => {
    expect(formatarDuracao(59)).toBe('0:59')
    expect(formatarDuracao(60)).toBe('1:00')
    expect(formatarDuracao(3599)).toBe('59:59')
    expect(formatarDuracao(3600)).toBe('1:00:00')
    expect(formatarDuracao(10_800)).toBe('3:00:00')
  })

  it('segundos necessários = ceil(70%), com a conta inteira do servidor', () => {
    expect(segundosNecessarios(10)).toBe(7)
    expect(segundosNecessarios(11)).toBe(8)
    expect(segundosNecessarios(212)).toBe(149)
    expect(segundosNecessarios(10_800)).toBe(7560)
  })

  it('lerDuracao aceita inteiros de 10 a 10800 e recusa decimal e texto', () => {
    expect(lerDuracao(9)).toBe('invalida')
    expect(lerDuracao(10)).toBe(10)
    expect(lerDuracao('10800')).toBe(10_800)
    expect(lerDuracao(10_801)).toBe('invalida')
    expect(lerDuracao('12.5')).toBe('invalida')
    expect(lerDuracao(12.5)).toBe('invalida')
    expect(lerDuracao('abc')).toBe('invalida')
    expect(lerDuracao('')).toBeNull()
    expect(lerDuracao('  ')).toBeNull()
    expect(lerDuracao(undefined)).toBeNull()
  })
})
