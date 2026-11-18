import { describe, expect, it } from 'vitest'
import {
  adicionarAlternativa,
  adicionarPergunta,
  atualizarAlternativa,
  atualizarEnunciado,
  escolherCorreta,
  moverPergunta,
  perguntaVazia,
  removerAlternativa,
  removerPergunta,
  type PerguntaEditor,
} from './questionario'

const congelar = (perguntas: PerguntaEditor[]): PerguntaEditor[] =>
  Object.freeze(perguntas.map((p) => Object.freeze({ ...p, alternativas: Object.freeze([...p.alternativas]) }))) as PerguntaEditor[]

const P = (enunciado: string, alternativas = ['a', 'b', 'c', 'd'], correta: number | null = 2): PerguntaEditor => ({
  enunciado,
  alternativas,
  correta,
})

describe('questionário (funções puras)', () => {
  it('adiciona perguntas até 10 e remove mantendo ao menos 1', () => {
    let lista = congelar([perguntaVazia()])
    for (let i = 0; i < 12; i++) lista = adicionarPergunta(lista)
    expect(lista).toHaveLength(10)
    expect(adicionarPergunta(lista)).toBe(lista)
    expect(lista[9]).toEqual({ enunciado: '', alternativas: ['', ''], correta: null })

    const uma = congelar([P('só')])
    expect(removerPergunta(uma, 0)).toBe(uma)
    const duas = congelar([P('1'), P('2')])
    expect(removerPergunta(duas, 0).map((p) => p.enunciado)).toEqual(['2'])
    expect(removerPergunta(duas, 5)).toBe(duas)
  })

  it('adiciona alternativas até 5 e remove mantendo ao menos 2', () => {
    let lista = congelar([P('q', ['a', 'b'], null)])
    for (let i = 0; i < 5; i++) lista = adicionarAlternativa(lista, 0)
    expect(lista[0].alternativas).toEqual(['a', 'b', '', '', ''])
    expect(adicionarAlternativa(lista, 0)).toBe(lista)

    const minimo = congelar([P('q', ['a', 'b'], 0)])
    expect(removerAlternativa(minimo, 0, 1)).toBe(minimo)
  })

  it('ao remover alternativa ajusta a certa: era ela -> null; anterior -> -1; posterior -> igual', () => {
    const lista = congelar([P('q', ['a', 'b', 'c', 'd'], 2)])
    expect(removerAlternativa(lista, 0, 2)[0]).toEqual({ enunciado: 'q', alternativas: ['a', 'b', 'd'], correta: null })
    expect(removerAlternativa(lista, 0, 0)[0]).toEqual({ enunciado: 'q', alternativas: ['b', 'c', 'd'], correta: 1 })
    expect(removerAlternativa(lista, 0, 3)[0]).toEqual({ enunciado: 'q', alternativas: ['a', 'b', 'c'], correta: 2 })
    const semCerta = congelar([P('q', ['a', 'b', 'c'], null)])
    expect(removerAlternativa(semCerta, 0, 0)[0].correta).toBeNull()
  })

  it('move perguntas e não faz nada nas pontas', () => {
    const lista = congelar([P('1'), P('2'), P('3')])
    expect(moverPergunta(lista, 0, 1).map((p) => p.enunciado)).toEqual(['2', '1', '3'])
    expect(moverPergunta(lista, 2, -1).map((p) => p.enunciado)).toEqual(['1', '3', '2'])
    expect(moverPergunta(lista, 0, -1)).toBe(lista)
    expect(moverPergunta(lista, 2, 1)).toBe(lista)
  })

  it('escolhe a certa e atualiza textos sem mexer nas outras perguntas', () => {
    const lista = congelar([P('1', ['a', 'b'], null), P('2')])
    const escolhida = escolherCorreta(lista, 0, 1)
    expect(escolhida[0].correta).toBe(1)
    expect(escolhida[1]).toBe(lista[1])
    expect(escolherCorreta(lista, 0, 7)).toBe(lista)

    expect(atualizarEnunciado(lista, 1, 'Novo')[1].enunciado).toBe('Novo')
    expect(atualizarAlternativa(lista, 0, 1, 'B')[0].alternativas).toEqual(['a', 'B'])
    expect(atualizarAlternativa(lista, 0, 9, 'x')).toBe(lista)
  })

  it('não altera a lista recebida (imutabilidade)', () => {
    const original = [P('1', ['a', 'b', 'c'], 1), P('2')]
    const copia = JSON.parse(JSON.stringify(original))
    const lista = congelar(original)
    adicionarPergunta(lista)
    removerPergunta(lista, 1)
    moverPergunta(lista, 0, 1)
    adicionarAlternativa(lista, 0)
    removerAlternativa(lista, 0, 0)
    escolherCorreta(lista, 0, 2)
    atualizarEnunciado(lista, 0, 'x')
    atualizarAlternativa(lista, 0, 0, 'x')
    expect(lista).toEqual(copia)
  })
})
