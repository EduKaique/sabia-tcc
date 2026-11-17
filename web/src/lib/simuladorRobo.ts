import type { CenarioRobo, PosicaoRobo } from '@/types'

/**
 * Simulador do Jogo do Robô: interpreta o JSON de `Blockly.serialization.workspaces.save` contra
 * um cenário, sem executar código (sem eval/new Function) e sem depender do runtime do Blockly.
 * O contrato (regras, limites e casos compartilhados com o simulador Java) está em fixtures/robo/README.md.
 */

export const LIMITE_PASSOS = 500
/** Visitas a bloco na execução mais iterações de repetir (mesmo com corpo vazio). */
export const LIMITE_OPERACOES = 10000
/** Níveis de aninhamento via inputs; o topo é o nível 1 e a cadeia next não aumenta o nível. */
export const MAX_PROFUNDIDADE = 10
/** Blocos que não são sombra em todas as pilhas do workspace. */
export const MAX_BLOCOS_WORKSPACE = 200

export type DirecaoRobo = 'CIMA' | 'BAIXO' | 'ESQUERDA' | 'DIREITA'

export type StatusSimulacao =
  | 'CHEGOU'
  | 'NAO_CHEGOU'
  | 'COLIDIU'
  | 'SAIU_DO_GRID'
  | 'SEM_BLOCOS'
  | 'LIMITE_EXCEDIDO'

/** Uma casa andada. Num passo com `ok: false` a posição é a última célula válida. */
export interface Passo {
  blockId: string
  acao: DirecaoRobo
  linha: number
  coluna: number
  ok: boolean
}

export interface Resultado {
  status: StatusSimulacao
  chegou: boolean
  blocosUsados: number
  passosExecutados: number
  blocosSoltos: number
  posicaoFinal: PosicaoRobo
  totalBlocosWorkspace: number
}

export interface Simulacao {
  passos: Passo[]
  resultado: Resultado
}

interface BlocoSerializado {
  type?: string
  id?: string
  x?: number
  y?: number
  fields?: Record<string, unknown>
  inputs?: Record<string, { block?: BlocoSerializado }>
  next?: { block?: BlocoSerializado }
}

const DESLOCAMENTO: Record<DirecaoRobo, PosicaoRobo> = {
  CIMA: { linha: -1, coluna: 0 },
  BAIXO: { linha: 1, coluna: 0 },
  ESQUERDA: { linha: 0, coluna: -1 },
  DIREITA: { linha: 0, coluna: 1 },
}

/** Interrompe a execução da pilha assim que o resultado fica definido. */
class Parada {
  readonly status: 'COLIDIU' | 'SAIU_DO_GRID' | 'LIMITE_EXCEDIDO'
  constructor(status: Parada['status']) {
    this.status = status
  }
}

function lerBlocosDeTopo(estadoJson: object | string): BlocoSerializado[] {
  let estado: unknown = estadoJson
  if (typeof estadoJson === 'string') {
    try {
      estado = JSON.parse(estadoJson)
    } catch {
      return []
    }
  }
  const blocos = (estado as { blocks?: { blocks?: unknown } } | null)?.blocks?.blocks
  return Array.isArray(blocos) ? (blocos as BlocoSerializado[]) : []
}

function inteiroEntre(valor: unknown, min: number, max: number, padrao: number) {
  const numero = Math.trunc(Number(valor))
  if (!Number.isFinite(numero)) return padrao
  return Math.min(max, Math.max(min, numero))
}

function ehDirecao(valor: unknown): valor is DirecaoRobo {
  return typeof valor === 'string' && Object.hasOwn(DESLOCAMENTO, valor)
}

/**
 * Total de blocos (sem sombras) e maior profundidade de aninhamento do workspace inteiro.
 * Iterativo, com pilha explícita: nenhuma entrada estoura a pilha de chamadas.
 */
function analisarWorkspace(topo: BlocoSerializado[]) {
  let totalBlocos = 0
  let profundidadeMaxima = 0
  const pendentes: [BlocoSerializado | undefined, number][] = topo.map((b) => [b, 1])
  while (pendentes.length > 0) {
    const [bloco, profundidade] = pendentes.pop()!
    if (!bloco || typeof bloco !== 'object') continue
    totalBlocos++
    profundidadeMaxima = Math.max(profundidadeMaxima, profundidade)
    pendentes.push([bloco.next?.block, profundidade])
    for (const input of Object.values(bloco.inputs ?? {})) {
      pendentes.push([input?.block, profundidade + 1])
    }
  }
  return { totalBlocos, profundidadeMaxima }
}

function contarBlocosRobo(bloco: BlocoSerializado | undefined): number {
  let total = 0
  for (let atual = bloco; atual; atual = atual.next?.block) {
    if (atual.type === 'robo_mover' || atual.type === 'robo_repetir') total++
    if (atual.type === 'robo_repetir') total += contarBlocosRobo(atual.inputs?.FAZER?.block)
  }
  return total
}

export function simular(cenario: CenarioRobo, estadoJson: object | string): Simulacao {
  const topo = lerBlocosDeTopo(estadoJson)
  const blocosSoltos = Math.max(0, topo.length - 1)
  const { totalBlocos, profundidadeMaxima } = analisarWorkspace(topo)

  // Workspace grande ou fundo demais: resultado determinístico, sem executar (e antes de qualquer recursão).
  if (profundidadeMaxima > MAX_PROFUNDIDADE || totalBlocos > MAX_BLOCOS_WORKSPACE) {
    return {
      passos: [],
      resultado: {
        status: 'LIMITE_EXCEDIDO',
        chegou: false,
        blocosUsados: 0,
        passosExecutados: 0,
        blocosSoltos,
        posicaoFinal: { ...cenario.inicio },
        totalBlocosWorkspace: totalBlocos,
      },
    }
  }

  const principal = [...topo].sort((a, b) => (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0))[0]
  const blocosUsados = contarBlocosRobo(principal)

  const passos: Passo[] = []
  const posicao = { ...cenario.inicio }
  const obstaculos = new Set(cenario.obstaculos.map((o) => `${o.linha},${o.coluna}`))

  const finalizar = (status: StatusSimulacao): Simulacao => ({
    passos,
    resultado: {
      status,
      chegou: status === 'CHEGOU',
      blocosUsados,
      passosExecutados: passos.length,
      blocosSoltos,
      posicaoFinal: { ...posicao },
      totalBlocosWorkspace: totalBlocos,
    },
  })

  if (blocosUsados === 0) return finalizar('SEM_BLOCOS')

  const mover = (blockId: string, direcao: DirecaoRobo, casas: number) => {
    for (let i = 0; i < casas; i++) {
      if (passos.length >= LIMITE_PASSOS) throw new Parada('LIMITE_EXCEDIDO')
      const linha = posicao.linha + DESLOCAMENTO[direcao].linha
      const coluna = posicao.coluna + DESLOCAMENTO[direcao].coluna
      const foraDoGrid =
        linha < 0 || linha >= cenario.linhas || coluna < 0 || coluna >= cenario.colunas
      const colidiu = !foraDoGrid && obstaculos.has(`${linha},${coluna}`)
      if (foraDoGrid || colidiu) {
        passos.push({ blockId, acao: direcao, ...posicao, ok: false })
        throw new Parada(foraDoGrid ? 'SAIU_DO_GRID' : 'COLIDIU')
      }
      posicao.linha = linha
      posicao.coluna = coluna
      passos.push({ blockId, acao: direcao, linha, coluna, ok: true })
    }
  }

  let operacoes = 0
  const operar = () => {
    operacoes++
    if (operacoes > LIMITE_OPERACOES) throw new Parada('LIMITE_EXCEDIDO')
  }

  const executar = (bloco: BlocoSerializado | undefined) => {
    for (let atual = bloco; atual; atual = atual.next?.block) {
      operar()
      if (atual.type === 'robo_mover') {
        const direcao = atual.fields?.DIRECAO
        if (ehDirecao(direcao)) {
          mover(atual.id ?? '', direcao, inteiroEntre(atual.fields?.CASAS, 1, 9, 1))
        }
      } else if (atual.type === 'robo_repetir') {
        const vezes = inteiroEntre(atual.fields?.VEZES, 1, 10, 1)
        for (let i = 0; i < vezes; i++) {
          operar()
          executar(atual.inputs?.FAZER?.block)
        }
      }
    }
  }

  try {
    executar(principal)
  } catch (erro) {
    if (erro instanceof Parada) return finalizar(erro.status)
    throw erro
  }

  const chegou =
    posicao.linha === cenario.destino.linha && posicao.coluna === cenario.destino.coluna
  return finalizar(chegou ? 'CHEGOU' : 'NAO_CHEGOU')
}
