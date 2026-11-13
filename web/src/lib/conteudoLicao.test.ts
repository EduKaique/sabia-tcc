import { describe, expect, it } from 'vitest'
import { temConteudo, temPaginaTexto } from '@/lib/conteudoLicao'

describe('temPaginaTexto', () => {
  it('é verdadeiro com resumo ou com conteúdo que tem texto', () => {
    expect(temPaginaTexto({ resumo: 'Laços', conteudo: null })).toBe(true)
    expect(temPaginaTexto({ resumo: null, conteudo: '<p>Repita o bloco</p>' })).toBe(true)
  })

  it('ignora resumo em branco e HTML só com tags, espaços e &nbsp;', () => {
    expect(temPaginaTexto({ resumo: '   ', conteudo: '<p>&nbsp;</p><br/>' })).toBe(false)
    expect(temPaginaTexto({ resumo: null, conteudo: null })).toBe(false)
  })
})

describe('temConteudo', () => {
  it('considera o vídeo mesmo sem texto', () => {
    expect(temConteudo({ resumo: null, conteudo: null, videoId: 'abc123' })).toBe(true)
    expect(temConteudo({ resumo: null, conteudo: '<p></p>', videoId: null })).toBe(false)
  })
})
