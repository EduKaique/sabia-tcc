import type { CenarioRobo } from '@/types'

/** Cenários prontos do Jogo do Robô (linha 0 é a de cima, coluna 0 é a da esquerda). */

export const CENARIO_LIVRE_5X5: CenarioRobo = {
  versao: 1,
  linhas: 5,
  colunas: 5,
  inicio: { linha: 4, coluna: 0 },
  destino: { linha: 0, coluna: 4 },
  obstaculos: [],
  blocosPermitidos: ['robo_mover', 'robo_repetir'],
}

export const CENARIO_OBSTACULOS_5X5: CenarioRobo = {
  versao: 1,
  linhas: 5,
  colunas: 5,
  inicio: { linha: 4, coluna: 0 },
  destino: { linha: 0, coluna: 4 },
  obstaculos: [
    { linha: 2, coluna: 0 },
    { linha: 4, coluna: 2 },
  ],
  blocosPermitidos: ['robo_mover', 'robo_repetir'],
}

/** Cenários que o professor pode escolher no formulário da atividade. */
export const PRESETS_CENARIO = [
  { id: 'livre-5x5', nome: 'Caminho livre (5×5)', cenario: CENARIO_LIVRE_5X5 },
  { id: 'obstaculos-5x5', nome: 'Com obstáculos (5×5)', cenario: CENARIO_OBSTACULOS_5X5 },
] as const

/** JSON com as chaves em ordem alfabética, para comparar cenários pelo conteúdo. */
function normalizar(valor: unknown): string {
  if (Array.isArray(valor)) return `[${valor.map(normalizar).join(',')}]`
  if (valor && typeof valor === 'object') {
    const entradas = Object.entries(valor).sort(([a], [b]) => a.localeCompare(b))
    return `{${entradas.map(([k, v]) => `${JSON.stringify(k)}:${normalizar(v)}`).join(',')}}`
  }
  return JSON.stringify(valor)
}

/** Cópia do cenário sem o limite de blocos (o limite é editado à parte do cenário). */
export function cenarioSemLimite(cenario: CenarioRobo): CenarioRobo {
  const copia = { ...cenario }
  delete copia.maxBlocos
  return copia
}

/** Id do preset com o mesmo conteúdo do cenário (o maxBlocos é ignorado), ou null. */
export function presetDoCenario(cenario: CenarioRobo): string | null {
  const alvo = normalizar(cenarioSemLimite(cenario))
  return PRESETS_CENARIO.find((p) => normalizar(p.cenario) === alvo)?.id ?? null
}
