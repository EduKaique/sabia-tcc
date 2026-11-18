import { describe, expect, it } from 'vitest'
import type { PaginaEditor } from './editorLicao'
import { erroDaPratica, extrairErro, separarErros } from './errosLicao'

const paginas: PaginaEditor[] = [
  { chave: 's-1', id: 1, tipo: 'TEXTO', titulo: '', conteudo: { html: '' } },
  { chave: 'n-1', tipo: 'IMAGEM_TEXTO', titulo: '', conteudo: {} },
]

const axiosErro = (status: number, data: object) => ({ response: { status, data } })

describe('errosLicao', () => {
  it('distribui paginas[i].campo para a página i e os metadados para os campos', () => {
    const s = separarErros(
      {
        'paginas[0].html': 'Escreva o texto.',
        'paginas[1].alt': 'Descreva a imagem.',
        'paginas[1].imagemUrl': 'Use https.',
        titulo: 'O título deve ter entre 3 e 255 caracteres.',
        paginas: 'O conteúdo das páginas passa do limite de 256 KB.',
        'paginas[9].html': 'Página que não existe mais.',
      },
      paginas
    )
    expect(s.paginas['s-1']).toEqual({ html: 'Escreva o texto.' })
    expect(s.paginas['n-1']).toEqual({ alt: 'Descreva a imagem.', imagemUrl: 'Use https.' })
    expect(s.metadados).toEqual({ titulo: 'O título deve ter entre 3 e 255 caracteres.' })
    expect(s.gerais).toEqual(['O conteúdo das páginas passa do limite de 256 KB.', 'Página que não existe mais.'])
  })

  it('preserva o subcaminho do vídeo e do questionário para o campo da página i', () => {
    const lista: PaginaEditor[] = [
      { chave: 's-7', id: 7, tipo: 'VIDEO_YOUTUBE', titulo: '', conteudo: { videoId: '' } },
      { chave: 'n-2', tipo: 'QUESTIONARIO', titulo: '', conteudo: {} },
    ]
    const s = separarErros(
      {
        'paginas[0].videoId': 'Informe um link do YouTube válido (https) ou o id do vídeo.',
        'paginas[0].duracaoSegundos': 'A duração deve ficar entre 10 e 10800 segundos.',
        'paginas[1].percentualMinimo': 'O percentual mínimo deve ficar entre 0 e 100.',
        'paginas[1].perguntas[2].alternativas[1]': 'A alternativa não pode ficar vazia.',
        'paginas[1].perguntas[0].correta': 'Indique a alternativa correta.',
      },
      lista
    )
    expect(s.paginas['s-7']).toEqual({
      videoId: 'Informe um link do YouTube válido (https) ou o id do vídeo.',
      duracaoSegundos: 'A duração deve ficar entre 10 e 10800 segundos.',
    })
    expect(s.paginas['n-2']).toEqual({
      percentualMinimo: 'O percentual mínimo deve ficar entre 0 e 100.',
      'perguntas[2].alternativas[1]': 'A alternativa não pode ficar vazia.',
      'perguntas[0].correta': 'Indique a alternativa correta.',
    })
    expect(s.gerais).toEqual([])
  })

  it('extrai status, mensagem e campos do ErroResponse', () => {
    expect(extrairErro(axiosErro(422, { status: 422, erro: 'Lição arquivada.' }))).toEqual({
      status: 422,
      mensagem: 'Lição arquivada.',
      campos: undefined,
    })
    expect(extrairErro(axiosErro(400, { erro: 'Dados inválidos', campos: { titulo: 'x' } })).campos).toEqual({ titulo: 'x' })
    expect(extrairErro(axiosErro(403, {})).mensagem).toBe('Você não tem acesso a esta lição.')
    expect(extrairErro(new Error('rede')).status).toBeNull()
  })

  it('400 sem campos no salvamento é erro de cenário (seção Prática)', () => {
    const e = extrairErro(axiosErro(400, { erro: 'O cenário não tem caminho até o destino.' }))
    expect(erroDaPratica(e, 'salvar')).toBe(true)
    expect(erroDaPratica(extrairErro(axiosErro(400, { erro: 'x', campos: { titulo: 'y' } })), 'salvar')).toBe(false)
  })

  it('422 da publicação: cenário vai para a Prática; o resto, para o banner', () => {
    expect(erroDaPratica(extrairErro(axiosErro(422, { erro: 'Escolha o cenário do Jogo do Robô antes de publicar.' })), 'publicar')).toBe(true)
    expect(erroDaPratica(extrairErro(axiosErro(422, { erro: 'Adicione ao menos uma página antes de publicar.' })), 'publicar')).toBe(false)
  })
})
