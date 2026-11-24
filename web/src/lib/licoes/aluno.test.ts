import { describe, expect, it } from 'vitest'
import type { LicaoDetalhe, PaginaAluno } from '@/types/licao'
import {
  ROTULO_ESTADO_ALUNO,
  ROTULO_MODO,
  aplicarCorrecao,
  aplicarPulso,
  aplicarVista,
  montarRespostas,
  paginaInicial,
  pendencias,
  progressoVideo,
  todasRespondidas,
  turmasDasLicoes,
} from './aluno'

const pagina = (id: number, tipo: PaginaAluno['tipo'], concluida: boolean): PaginaAluno => ({
  id,
  ordem: id,
  tipo,
  titulo: null,
  conteudo: {},
  progresso: { concluida },
})

const detalhe = (paginas: PaginaAluno[], extra: Partial<LicaoDetalhe> = {}): LicaoDetalhe => ({
  id: 1,
  titulo: 'L',
  conceito: 'C',
  resumo: null,
  modo: 'BLOCOS',
  cenarioJson: null,
  estadoJson: null,
  atividadeConcluida: false,
  concluidaEm: null,
  estado: 'NAO_INICIADA',
  praticaLiberada: false,
  paginas,
  ...extra,
})

describe('lições do aluno (regras puras)', () => {
  it('página inicial: primeira não concluída; todas concluídas -> primeira; sem páginas -> 0', () => {
    expect(paginaInicial([pagina(1, 'TEXTO', true), pagina(2, 'VIDEO_YOUTUBE', false), pagina(3, 'TEXTO', false)])).toBe(1)
    expect(paginaInicial([pagina(1, 'TEXTO', true), pagina(2, 'TEXTO', true)])).toBe(0)
    expect(paginaInicial([])).toBe(0)
  })

  it('pendências com o rótulo "Página N - Tipo"', () => {
    const p = [
      pagina(1, 'TEXTO', true),
      pagina(2, 'VIDEO_YOUTUBE', false),
      pagina(3, 'QUESTIONARIO', false),
      pagina(4, 'IMAGEM_TEXTO', false),
    ]
    expect(pendencias(p)).toEqual([
      { indice: 1, rotulo: 'Página 2 - Vídeo' },
      { indice: 2, rotulo: 'Página 3 - Questionário' },
      { indice: 3, rotulo: 'Página 4 - Imagem' },
    ])
    expect(pendencias([pagina(1, 'TEXTO', true)])).toEqual([])
  })

  it('rótulos de estado e de modo', () => {
    expect(ROTULO_ESTADO_ALUNO).toEqual({
      NAO_INICIADA: 'Não iniciada',
      EM_ANDAMENTO: 'Em andamento',
      PRATICA_LIBERADA: 'Prática liberada',
      CONCLUIDA: 'Concluída',
    })
    expect(ROTULO_MODO.JOGO_ROBO).toBe('Jogo do Robô')
    expect(ROTULO_MODO.BLOCOS).toBe('Programação em blocos')
  })

  it('progresso do vídeo em mm:ss, percentual e conferido', () => {
    expect(progressoVideo({ segundosCreditados: 75, segundosNecessarios: 149, conferido: false })).toEqual({
      assistido: '1:15',
      necessario: '2:29',
      percentual: 50,
      conferido: false,
    })
    expect(progressoVideo({ segundosCreditados: 150, segundosNecessarios: 149, conferido: true })).toMatchObject({
      assistido: '2:29',
      percentual: 100,
      conferido: true,
    })
    expect(progressoVideo({ segundosCreditados: 0, segundosNecessarios: 0, conferido: false }).percentual).toBe(0)
  })

  it('respostas: ordem preservada, todas respondidas e índice nulo bloqueia', () => {
    expect(todasRespondidas([1, 0, 2], 3)).toBe(true)
    expect(todasRespondidas([1, null, 2], 3)).toBe(false)
    expect(todasRespondidas([1, 0], 3)).toBe(false)
    expect(montarRespostas([2, 0, 1], 3)).toEqual([2, 0, 1])
    expect(montarRespostas([2, null, 1], 3)).toBeNull()
  })

  it('turmas distintas das lições, na ordem em que aparecem', () => {
    const l = (...turmas: [number, string][]) => ({ turmas: turmas.map(([id, nome]) => ({ id, nome })) })
    expect(turmasDasLicoes([l([10, 'A']), l([10, 'A'], [11, 'B']), l()])).toEqual([
      { id: 10, nome: 'A' },
      { id: 11, nome: 'B' },
    ])
  })

  it('aplica as respostas de vista, pulso e questionário ao detalhe (sem mutar)', () => {
    const d = detalhe([pagina(1, 'TEXTO', false), pagina(2, 'VIDEO_YOUTUBE', false), pagina(3, 'QUESTIONARIO', false)])
    const v = aplicarVista(d, { paginaId: 1, concluida: true, praticaLiberada: false })
    expect(v.paginas[0].progresso.concluida).toBe(true)
    expect(v.estado).toBe('EM_ANDAMENTO')
    expect(d.paginas[0].progresso.concluida).toBe(false)
    expect(v.paginas[1]).toBe(d.paginas[1])

    const p = aplicarPulso(v, { paginaId: 2, segundosCreditados: 7, segundosNecessarios: 7, conferido: true, praticaLiberada: false })
    expect(p.paginas[1].progresso).toEqual({
      concluida: true,
      video: { segundosCreditados: 7, segundosNecessarios: 7, conferido: true },
    })

    const c = aplicarCorrecao(p, {
      paginaId: 3,
      acertos: 2,
      total: 2,
      percentual: 100,
      aprovado: true,
      aprovadoNaPagina: true,
      melhorPercentual: 100,
      tentativas: 2,
      perguntas: [{ certa: true }, { certa: true }],
      praticaLiberada: true,
    })
    expect(c.paginas[2].progresso).toEqual({
      concluida: true,
      questionario: { tentativas: 2, melhorPercentual: 100, aprovado: true },
    })
    expect(c.praticaLiberada).toBe(true)
    expect(c.estado).toBe('PRATICA_LIBERADA')

    // Reprovar depois de aprovado não desfaz a conclusão; lição concluída continua CONCLUIDA.
    const r = aplicarCorrecao(detalhe([pagina(3, 'QUESTIONARIO', true)], { concluidaEm: '2026-11-18T10:00:00' }), {
      paginaId: 3,
      acertos: 0,
      total: 2,
      percentual: 0,
      aprovado: false,
      aprovadoNaPagina: true,
      melhorPercentual: 100,
      tentativas: 3,
      perguntas: [{ certa: false }, { certa: false }],
      praticaLiberada: true,
    })
    expect(r.paginas[0].progresso.concluida).toBe(true)
    expect(r.estado).toBe('CONCLUIDA')
  })
})
