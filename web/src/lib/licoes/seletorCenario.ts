import type { CenarioRobo } from '@/types'
import {
  PREFIXO_CENARIO_SALVO,
  PRESETS_CENARIO,
  cenarioSemLimite,
  lerCenario,
  opcaoDoCenario,
} from '@/lib/cenariosRobo'

/** Valor da opção "Cenário personalizado (atual)": o snapshot gravado que não bate com nenhuma opção. */
export const OPCAO_ATUAL = 'atual'

type Salvo = { id: number; cenarioJson: string }

/** Opção que corresponde ao cenarioJson gravado: preset, "salvo:<id>", "atual" ou undefined (sem cenário). */
export function opcaoInicial(cenarioJson: string | null, salvos: Salvo[]): string | undefined {
  const cenario = lerCenario(cenarioJson)
  if (!cenario) return undefined
  return opcaoDoCenario(cenario, salvos) ?? OPCAO_ATUAL
}

/** Cenário de uma opção do seletor; "atual" devolve o snapshot gravado. */
export function resolverOpcao(opcao: string | undefined, atual: CenarioRobo | null, salvos: Salvo[]): CenarioRobo | null {
  if (!opcao) return null
  if (opcao === OPCAO_ATUAL) return atual
  if (opcao.startsWith(PREFIXO_CENARIO_SALVO)) {
    const id = Number(opcao.slice(PREFIXO_CENARIO_SALVO.length))
    return lerCenario(salvos.find((s) => s.id === id)?.cenarioJson)
  }
  return PRESETS_CENARIO.find((p) => p.id === opcao)?.cenario ?? null
}

/** Snapshot gravado na lição: o cenário sem o limite próprio e com o "Limite de blocos" do formulário, se houver. */
export function montarCenarioJson(cenario: CenarioRobo, limite: number | undefined): string {
  const semLimite = cenarioSemLimite(cenario)
  return JSON.stringify(limite ? { ...semLimite, maxBlocos: limite } : semLimite)
}

/** "Limite de blocos": vazio = sem limite (undefined); inteiro >= 1 = limite; o resto é inválido (null). */
export function lerLimite(texto: string): number | undefined | null {
  const t = texto.trim()
  if (t === '') return undefined
  if (!/^\d+$/.test(t)) return null
  const n = Number(t)
  return n >= 1 ? n : null
}
