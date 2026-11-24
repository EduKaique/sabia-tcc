/**
 * Página de questionário no editor: tipos e funções puras (sem mutação) para montar as perguntas. Limites do
 * servidor (ValidadorConteudoPagina).
 */

export const LIMITES_QUESTIONARIO = {
  minPerguntas: 1,
  maxPerguntas: 10,
  minAlternativas: 2,
  maxAlternativas: 5,
  enunciadoMax: 500,
  alternativaMax: 200,
  percentualPadrao: 70,
} as const
const L = LIMITES_QUESTIONARIO

/** `correta` é null enquanto o professor não escolheu a alternativa certa (só no editor; o envio exige número). */
export interface PerguntaEditor {
  enunciado: string
  alternativas: string[]
  correta: number | null
}

export interface ConteudoQuestionarioEditor {
  percentualMinimo: number | null
  perguntas: PerguntaEditor[]
}

/** Pergunta nova: enunciado vazio, duas alternativas vazias e nenhuma certa. */
export function perguntaVazia(): PerguntaEditor {
  return { enunciado: '', alternativas: ['', ''], correta: null }
}

function trocar(perguntas: PerguntaEditor[], indice: number, f: (p: PerguntaEditor) => PerguntaEditor) {
  if (indice < 0 || indice >= perguntas.length) return perguntas
  return perguntas.map((p, i) => (i === indice ? f(p) : p))
}

/** Acrescenta uma pergunta vazia no fim (até 10). */
export function adicionarPergunta(perguntas: PerguntaEditor[]): PerguntaEditor[] {
  return perguntas.length >= L.maxPerguntas ? perguntas : [...perguntas, perguntaVazia()]
}

/** Remove a pergunta, mantendo ao menos uma. */
export function removerPergunta(perguntas: PerguntaEditor[], indice: number): PerguntaEditor[] {
  if (perguntas.length <= L.minPerguntas || indice < 0 || indice >= perguntas.length) return perguntas
  return perguntas.filter((_, i) => i !== indice)
}

/** Troca a pergunta de lugar com a vizinha (−1 sobe, +1 desce); nas pontas não muda nada. */
export function moverPergunta(perguntas: PerguntaEditor[], indice: number, direcao: -1 | 1): PerguntaEditor[] {
  const destino = indice + direcao
  if (indice < 0 || indice >= perguntas.length || destino < 0 || destino >= perguntas.length) return perguntas
  const nova = [...perguntas]
  ;[nova[indice], nova[destino]] = [nova[destino], nova[indice]]
  return nova
}

/** Acrescenta uma alternativa vazia na pergunta (até 5). */
export function adicionarAlternativa(perguntas: PerguntaEditor[], indice: number): PerguntaEditor[] {
  const p = perguntas[indice]
  if (!p || p.alternativas.length >= L.maxAlternativas) return perguntas
  return trocar(perguntas, indice, (q) => ({ ...q, alternativas: [...q.alternativas, ''] }))
}

/**
 * Remove a alternativa (mantendo ao menos duas) e ajusta a certa: se era ela, fica sem certa (null); se era
 * anterior à certa, a certa desce uma posição; se era posterior, não muda.
 */
export function removerAlternativa(perguntas: PerguntaEditor[], indice: number, alternativa: number): PerguntaEditor[] {
  const p = perguntas[indice]
  if (!p || p.alternativas.length <= L.minAlternativas || alternativa < 0 || alternativa >= p.alternativas.length) {
    return perguntas
  }
  let correta = p.correta
  if (correta === alternativa) correta = null
  else if (correta != null && alternativa < correta) correta = correta - 1
  return trocar(perguntas, indice, (q) => ({
    ...q,
    alternativas: q.alternativas.filter((_, k) => k !== alternativa),
    correta,
  }))
}

/** Marca a alternativa certa da pergunta. */
export function escolherCorreta(perguntas: PerguntaEditor[], indice: number, alternativa: number): PerguntaEditor[] {
  const p = perguntas[indice]
  if (!p || alternativa < 0 || alternativa >= p.alternativas.length) return perguntas
  return trocar(perguntas, indice, (q) => ({ ...q, correta: alternativa }))
}

/** Troca o enunciado da pergunta. */
export function atualizarEnunciado(perguntas: PerguntaEditor[], indice: number, enunciado: string): PerguntaEditor[] {
  return trocar(perguntas, indice, (q) => ({ ...q, enunciado }))
}

/** Troca o texto de uma alternativa. */
export function atualizarAlternativa(
  perguntas: PerguntaEditor[],
  indice: number,
  alternativa: number,
  texto: string
): PerguntaEditor[] {
  const p = perguntas[indice]
  if (!p || alternativa < 0 || alternativa >= p.alternativas.length) return perguntas
  return trocar(perguntas, indice, (q) => ({
    ...q,
    alternativas: q.alternativas.map((a, k) => (k === alternativa ? texto : a)),
  }))
}
