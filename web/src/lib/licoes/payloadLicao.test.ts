import { describe, expect, it } from 'vitest'
import type { LicaoProfessorDetalhe } from '@/types/licaoProfessor'
import { editorReducer, estadoInicialEditor, type AcaoEditor, type EstadoEditor } from './editorLicao'
import { htmlVazio, montarPayload } from './payloadLicao'

const QUESTIONARIO = {
  percentualMinimo: 70,
  perguntas: [{ enunciado: 'Qual?', alternativas: ['a', 'b', 'c'], correta: 2 }],
}
const VIDEO = { videoId: 'dQw4w9WgXcQ', titulo: 'Aula', duracaoSegundos: 212 }
const UPLOAD = { qualquer: 'coisa' }

const DETALHE: LicaoProfessorDetalhe = {
  id: 3,
  estado: 'PUBLICADA',
  titulo: 'Laços',
  conceito: 'Repetição',
  resumo: 'Sobre laços',
  modo: 'JOGO_ROBO',
  cenarioJson: '{"versao":1}',
  turmaIds: [],
  paginas: [
    { id: 1, ordem: 0, tipo: 'TEXTO', titulo: 'Intro', conteudo: { html: '<p>Oi</p>' } },
    { id: 2, ordem: 1, tipo: 'VIDEO_YOUTUBE', titulo: 'Vídeo', conteudo: VIDEO },
    { id: 3, ordem: 2, tipo: 'QUESTIONARIO', titulo: null, conteudo: QUESTIONARIO },
    { id: 4, ordem: 3, tipo: 'VIDEO_UPLOAD', titulo: 'Upload', conteudo: UPLOAD },
  ],
  publicadaEm: '2026-11-17T10:00:00',
  criadaEm: null,
  atualizadaEm: null,
}

const aplicar = (...acoes: AcaoEditor[]): EstadoEditor =>
  acoes.reduce(editorReducer, editorReducer(estadoInicialEditor(), { tipo: 'carregar', detalhe: DETALHE }))

describe('montarPayload', () => {
  it('reenvia vídeo, questionário e upload intactos (mesmo objeto, com o gabarito)', () => {
    const p = montarPayload(aplicar())
    expect(p.paginas[1]).toEqual({ id: 2, tipo: 'VIDEO_YOUTUBE', titulo: 'Vídeo', conteudo: VIDEO })
    expect(p.paginas[1].conteudo).toBe(VIDEO)
    expect(p.paginas[2]).toEqual({ id: 3, tipo: 'QUESTIONARIO', titulo: null, conteudo: QUESTIONARIO })
    expect(p.paginas[2].conteudo).toBe(QUESTIONARIO)
    expect((p.paginas[2].conteudo as typeof QUESTIONARIO).perguntas[0].correta).toBe(2)
    expect(p.paginas[3]).toEqual({ id: 4, tipo: 'VIDEO_UPLOAD', titulo: 'Upload', conteudo: UPLOAD })
  })

  it('mantém as páginas não editáveis intactas depois de mover e de editar as outras', () => {
    const p = montarPayload(
      aplicar(
        { tipo: 'moverPagina', chave: 's-3', direcao: -1 },
        { tipo: 'moverPagina', chave: 's-3', direcao: -1 },
        { tipo: 'atualizarPagina', chave: 's-1', conteudo: { html: '<p>Novo</p>' } }
      )
    )
    expect(p.paginas.map((x) => x.id)).toEqual([3, 1, 2, 4])
    expect(p.paginas[0].conteudo).toBe(QUESTIONARIO)
    expect(p.paginas[2].conteudo).toBe(VIDEO)
  })

  it('páginas novas vão sem id, existentes com id, na ordem da lista', () => {
    const p = montarPayload(
      aplicar(
        { tipo: 'adicionarPagina', tipoPagina: 'TEXTO' },
        { tipo: 'atualizarPagina', chave: 'n-1', titulo: '  Nova  ', conteudo: { html: '<p>x</p>' } },
        { tipo: 'moverPagina', chave: 'n-1', direcao: -1 }
      )
    )
    expect(p.paginas.map((x) => x.id)).toEqual([1, 2, 3, undefined, 4])
    expect('id' in p.paginas[3]).toBe(false)
    expect(p.paginas[3]).toEqual({ tipo: 'TEXTO', titulo: 'Nova', conteudo: { html: '<p>x</p>' } })
  })

  it('removida não vai na lista (o servidor a apaga)', () => {
    const p = montarPayload(aplicar({ tipo: 'removerPagina', chave: 's-2' }))
    expect(p.paginas.map((x) => x.id)).toEqual([1, 3, 4])
  })

  it('imagem com texto: apara, e só manda legenda e html quando têm conteúdo', () => {
    const p = montarPayload(
      aplicar(
        { tipo: 'adicionarPagina', tipoPagina: 'IMAGEM_TEXTO' },
        { tipo: 'atualizarPagina', chave: 'n-1', conteudo: { imagemUrl: ' https://x.org/a.png ', alt: ' Gato ', legenda: '  ', html: '<p></p>' } }
      )
    )
    expect(p.paginas[4].conteudo).toEqual({ imagemUrl: 'https://x.org/a.png', alt: 'Gato' })
  })

  it('em BLOCOS o cenarioJson vai nulo; no robô vai o escolhido', () => {
    expect(montarPayload(aplicar()).cenarioJson).toBe('{"versao":1}')
    expect(montarPayload(aplicar({ tipo: 'trocarModo', modo: 'BLOCOS' })).cenarioJson).toBeNull()
  })

  it('metadados aparados e resumo vazio vira nulo', () => {
    const p = montarPayload(aplicar({ tipo: 'atualizarMetadados', metadados: { titulo: '  Laços  ', resumo: '   ' } }))
    expect(p.titulo).toBe('Laços')
    expect(p.resumo).toBeNull()
    expect(p.modo).toBe('JOGO_ROBO')
  })

  it('htmlVazio reconhece o parágrafo vazio do editor', () => {
    expect(htmlVazio('<p></p>')).toBe(true)
    expect(htmlVazio('<p> &nbsp; </p>')).toBe(true)
    expect(htmlVazio('<p>a</p>')).toBe(false)
  })
})
