import type { CenarioRobo, PosicaoRobo, TipoBlocoRobo } from '@/types'

/**
 * Funções puras do editor de cenários do Jogo do Robô. Todas devolvem um cenário novo e preservam
 * as invariantes: início e destino dentro da grade, diferentes entre si e nunca cobertos por obstáculo;
 * obstáculos dentro da grade e sem repetição. A existência de caminho é verificada só no servidor.
 */

export const GRADE_MIN = 3
export const GRADE_MAX = 10
export const BLOCOS_ROBO: { tipo: TipoBlocoRobo; nome: string }[] = [
  { tipo: 'robo_mover', nome: 'Mover' },
  { tipo: 'robo_repetir', nome: 'Repetir' },
]

export type FerramentaCenario = 'inicio' | 'destino' | 'obstaculo' | 'apagar'

export const mesmaPosicao = (a: PosicaoRobo, b: PosicaoRobo) =>
  a.linha === b.linha && a.coluna === b.coluna

const limitarGrade = (n: number) => Math.min(GRADE_MAX, Math.max(GRADE_MIN, Math.trunc(n)))

/** Grade vazia; início no canto inferior esquerdo e destino no superior direito, como nos cenários prontos. */
export function criarCenarioVazio(linhas: number, colunas: number): CenarioRobo {
  const l = limitarGrade(linhas)
  const c = limitarGrade(colunas)
  return {
    versao: 1,
    linhas: l,
    colunas: c,
    inicio: { linha: l - 1, coluna: 0 },
    destino: { linha: 0, coluna: c - 1 },
    obstaculos: [],
    blocosPermitidos: ['robo_mover', 'robo_repetir'],
  }
}

/**
 * Aplica a ferramenta na célula. Início/destino não vão para a célula do outro (nada muda) e
 * removem o obstáculo da célula; obstáculo alterna e não vale em início/destino; apagar remove o obstáculo.
 */
export function aplicarFerramenta(
  cenario: CenarioRobo,
  ferramenta: FerramentaCenario,
  celula: PosicaoRobo
): CenarioRobo {
  const pos = { linha: celula.linha, coluna: celula.coluna }
  const foraDaGrade =
    pos.linha < 0 || pos.linha >= cenario.linhas || pos.coluna < 0 || pos.coluna >= cenario.colunas
  if (foraDaGrade) return cenario
  const semObstaculoAqui = cenario.obstaculos.filter((o) => !mesmaPosicao(o, pos))

  switch (ferramenta) {
    case 'inicio':
      if (mesmaPosicao(pos, cenario.destino)) return cenario
      return { ...cenario, inicio: pos, obstaculos: semObstaculoAqui }
    case 'destino':
      if (mesmaPosicao(pos, cenario.inicio)) return cenario
      return { ...cenario, destino: pos, obstaculos: semObstaculoAqui }
    case 'obstaculo':
      if (mesmaPosicao(pos, cenario.inicio) || mesmaPosicao(pos, cenario.destino)) return cenario
      return semObstaculoAqui.length < cenario.obstaculos.length
        ? { ...cenario, obstaculos: semObstaculoAqui }
        : { ...cenario, obstaculos: [...cenario.obstaculos, pos] }
    case 'apagar':
      return { ...cenario, obstaculos: semObstaculoAqui }
  }
}

/**
 * Muda o tamanho (limitado a 3–10). Obstáculos fora da nova grade são descartados; início e destino
 * fora dela são trazidos para a borda mais próxima. Se coincidirem, o destino vai para o primeiro canto livre.
 */
export function redimensionar(cenario: CenarioRobo, linhas: number, colunas: number): CenarioRobo {
  const l = limitarGrade(linhas)
  const c = limitarGrade(colunas)
  const trazer = (p: PosicaoRobo) => ({
    linha: Math.min(p.linha, l - 1),
    coluna: Math.min(p.coluna, c - 1),
  })
  const inicio = trazer(cenario.inicio)
  let destino = trazer(cenario.destino)
  if (mesmaPosicao(inicio, destino)) {
    const cantos = [
      { linha: 0, coluna: c - 1 },
      { linha: l - 1, coluna: 0 },
      { linha: 0, coluna: 0 },
      { linha: l - 1, coluna: c - 1 },
    ]
    destino = cantos.find((canto) => !mesmaPosicao(canto, inicio))!
  }
  const obstaculos = cenario.obstaculos.filter(
    (o) =>
      o.linha < l && o.coluna < c && !mesmaPosicao(o, inicio) && !mesmaPosicao(o, destino)
  )
  return { ...cenario, linhas: l, colunas: c, inicio, destino, obstaculos }
}

/** Cenário final a salvar: versão 1, blocos na ordem padrão e maxBlocos só se for inteiro >= 1. */
export function montarCenario(
  cenario: CenarioRobo,
  blocosPermitidos: TipoBlocoRobo[],
  maxBlocos?: number | null
): CenarioRobo {
  const final: CenarioRobo = {
    versao: 1,
    linhas: cenario.linhas,
    colunas: cenario.colunas,
    inicio: { ...cenario.inicio },
    destino: { ...cenario.destino },
    obstaculos: cenario.obstaculos.map((o) => ({ linha: o.linha, coluna: o.coluna })),
    blocosPermitidos: BLOCOS_ROBO.map((b) => b.tipo).filter((t) => blocosPermitidos.includes(t)),
  }
  if (maxBlocos != null && Number.isInteger(maxBlocos) && maxBlocos >= 1) final.maxBlocos = maxBlocos
  return final
}

/** Validação só de forma (grade, início ≠ destino, ao menos um bloco); null se estiver ok. */
export function validarFormaCenario(cenario: CenarioRobo): string | null {
  const dentro = (n: number) => Number.isInteger(n) && n >= GRADE_MIN && n <= GRADE_MAX
  if (!dentro(cenario.linhas) || !dentro(cenario.colunas)) {
    return `A grade deve ter entre ${GRADE_MIN} e ${GRADE_MAX} linhas e colunas.`
  }
  if (mesmaPosicao(cenario.inicio, cenario.destino)) {
    return 'O início e o destino devem ficar em casas diferentes.'
  }
  if (cenario.blocosPermitidos.length === 0) return 'Escolha ao menos um bloco permitido.'
  return null
}
