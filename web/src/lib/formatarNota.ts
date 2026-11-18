/** Número em pt-BR com no máximo 2 casas decimais (ex.: 8,5; 10; 7,25). */
export function formatarNumero(valor: number): string {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

/** Nota obtida sobre o máximo da atividade (ex.: "8,5 / 10"); null quando ainda não há nota. */
export function formatarNota(nota: number | null | undefined, maximo: number): string | null {
  if (nota == null) return null
  return `${formatarNumero(nota)} / ${formatarNumero(maximo)}`
}

/** Quanto a atividade vale (ex.: "Vale 10 pontos", "Vale 1 ponto"). */
export function formatarPontos(maximo: number): string {
  return `Vale ${formatarNumero(maximo)} ${maximo === 1 ? 'ponto' : 'pontos'}`
}
