export const CORES = {
  azul: '#426cda',
  amarelo: '#f9bd15',
  verde: '#60bb75',
  laranja: '#fe7629',
  roxo: '#8d4ce6',
  erro: '#b3261e',
  cinza: '#9aa1b9',
  grade: '#e4e7f1',
  texto: '#3a4266',
} as const

export const PALETA_ALUNOS = [CORES.azul, CORES.laranja, CORES.roxo, CORES.verde, CORES.erro, CORES.amarelo]

export const formatarPercentual = (valor: number | null | undefined, casas = 1) =>
  valor == null ? '--' : `${valor.toFixed(casas)}%`

export const abreviar = (texto: string, max = 14) =>
  texto.length > max ? `${texto.slice(0, max - 1)}…` : texto
