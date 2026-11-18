import { describe, expect, it } from 'vitest'
import type { LicaoProfessorDetalhe } from '@/types/licaoProfessor'
import {
  MAX_PAGINAS,
  editorReducer,
  estadoInicialEditor,
  prontidaoPublicacao,
  type AcaoEditor,
  type EstadoEditor,
} from './editorLicao'

const DETALHE: LicaoProfessorDetalhe = {
  id: 3,
  estado: 'RASCUNHO',
  titulo: 'Laços',
  conceito: 'Repetição',
  resumo: null,
  modo: 'BLOCOS',
  cenarioJson: null,
  turmaIds: [10],
  paginas: [
    { id: 2, ordem: 1, tipo: 'VIDEO_YOUTUBE', titulo: 'Vídeo', conteudo: { videoId: 'dQw4w9WgXcQ', duracaoSegundos: 212 } },
    { id: 1, ordem: 0, tipo: 'TEXTO', titulo: null, conteudo: { html: '<p>Oi</p>' } },
  ],
  publicadaEm: null,
  criadaEm: '2026-11-17T10:00:00',
  atualizadaEm: '2026-11-17T10:00:00',
}

const aplicar = (estado: EstadoEditor, ...acoes: AcaoEditor[]) => acoes.reduce(editorReducer, estado)
const carregado = () => aplicar(estadoInicialEditor(), { tipo: 'carregar', detalhe: DETALHE })

describe('editorReducer', () => {
  it('carregar ordena as páginas pela ordem e usa chaves do servidor', () => {
    const e = carregado()
    expect(e.paginas.map((p) => p.chave)).toEqual(['s-1', 's-2'])
    expect(e.paginas[0].titulo).toBe('')
    expect(e.metadados).toEqual({ titulo: 'Laços', conceito: 'Repetição', resumo: '' })
    expect(e.turmaIds).toEqual([10])
    expect(e.sujo).toBe(false)
    expect(e.versao).toBe(1)
  })

  it('adicionar cria páginas com chaves temporárias e conteúdo vazio', () => {
    const e = aplicar(carregado(), { tipo: 'adicionarPagina', tipoPagina: 'TEXTO' }, { tipo: 'adicionarPagina', tipoPagina: 'IMAGEM_TEXTO' })
    expect(e.paginas.map((p) => p.chave)).toEqual(['s-1', 's-2', 'n-1', 'n-2'])
    expect(e.paginas[2]).toMatchObject({ tipo: 'TEXTO', conteudo: { html: '' } })
    expect(e.paginas[3].id).toBeUndefined()
    expect(e.paginas[3].conteudo).toEqual({ imagemUrl: '', alt: '', legenda: '', html: '' })
    expect(e.sujo).toBe(true)
  })

  it('não passa de 30 páginas', () => {
    let e = estadoInicialEditor()
    for (let i = 0; i < MAX_PAGINAS + 3; i++) e = editorReducer(e, { tipo: 'adicionarPagina', tipoPagina: 'TEXTO' })
    expect(e.paginas).toHaveLength(MAX_PAGINAS)
  })

  it('remover tira só a página indicada', () => {
    const e = aplicar(carregado(), { tipo: 'removerPagina', chave: 's-1' })
    expect(e.paginas.map((p) => p.chave)).toEqual(['s-2'])
    expect(aplicar(e, { tipo: 'removerPagina', chave: 'nao-existe' })).toBe(e)
  })

  it('mover troca vizinhas e não faz nada nas pontas', () => {
    const e = carregado()
    expect(aplicar(e, { tipo: 'moverPagina', chave: 's-1', direcao: 1 }).paginas.map((p) => p.chave)).toEqual(['s-2', 's-1'])
    expect(aplicar(e, { tipo: 'moverPagina', chave: 's-2', direcao: -1 }).paginas.map((p) => p.chave)).toEqual(['s-2', 's-1'])
    expect(aplicar(e, { tipo: 'moverPagina', chave: 's-1', direcao: -1 })).toBe(e)
    expect(aplicar(e, { tipo: 'moverPagina', chave: 's-2', direcao: 1 })).toBe(e)
  })

  it('atualizar muda título e conteúdo das páginas editáveis', () => {
    const e = aplicar(carregado(), { tipo: 'atualizarPagina', chave: 's-1', titulo: 'Intro', conteudo: { html: '<p>Novo</p>' } })
    expect(e.paginas[0]).toMatchObject({ titulo: 'Intro', conteudo: { html: '<p>Novo</p>' } })
  })

  it('atualizar não mexe em páginas de tipos ainda não editáveis', () => {
    const e = carregado()
    const depois = aplicar(e, { tipo: 'atualizarPagina', chave: 's-2', titulo: 'Outro', conteudo: { html: 'x' } })
    expect(depois).toBe(e)
    expect(depois.paginas[1].conteudo).toBe(DETALHE.paginas[0].conteudo)
  })

  it('metadados, modo, cenário e turmas marcam o estado como sujo', () => {
    const e = aplicar(
      carregado(),
      { tipo: 'atualizarMetadados', metadados: { resumo: 'Sobre laços' } },
      { tipo: 'trocarModo', modo: 'JOGO_ROBO' },
      { tipo: 'trocarCenario', cenarioJson: '{"versao":1}' },
      { tipo: 'trocarTurmas', turmaIds: [12, 10, 12] }
    )
    expect(e.metadados.resumo).toBe('Sobre laços')
    expect(e.modo).toBe('JOGO_ROBO')
    expect(e.cenarioJson).toBe('{"versao":1}')
    expect(e.turmaIds).toEqual([10, 12])
    expect(e.sujo).toBe(true)
  })

  it('carregar com manterTurmas preserva a seleção local e continua sujo', () => {
    const e = aplicar(carregado(), { tipo: 'trocarTurmas', turmaIds: [11] }, { tipo: 'carregar', detalhe: DETALHE, manterTurmas: true })
    expect(e.turmaIds).toEqual([11])
    expect(e.sujo).toBe(true)
  })

  it('prontidão pede página e, no robô, o cenário', () => {
    expect(prontidaoPublicacao(estadoInicialEditor()).map((i) => i.ok)).toEqual([false])
    const robo = aplicar(carregado(), { tipo: 'trocarModo', modo: 'JOGO_ROBO' })
    expect(prontidaoPublicacao(robo).map((i) => i.ok)).toEqual([true, false])
    expect(prontidaoPublicacao(aplicar(robo, { tipo: 'trocarCenario', cenarioJson: '{}' })).every((i) => i.ok)).toBe(true)
  })
})
