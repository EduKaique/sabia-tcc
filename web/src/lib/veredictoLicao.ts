import type { ConclusaoAtividade } from '@/types/licao'

export interface VeredictoConclusao {
  concluida: boolean
  /** Mensagem amigável quando a prática não foi concluída; null quando foi. */
  mensagem: string | null
}

const MENSAGEM_PADRAO = 'Seu programa ainda não completou a atividade. Ajuste e tente de novo.'

/** Traduz a resposta do servidor em o que mostrar ao aluno. Vale sempre a decisão do servidor. */
export function veredictoConclusao(resposta: ConclusaoAtividade): VeredictoConclusao {
  if (resposta.atividadeConcluida) return { concluida: true, mensagem: null }
  return { concluida: false, mensagem: `Quase lá! ${resposta.validacao?.motivo ?? MENSAGEM_PADRAO}` }
}
