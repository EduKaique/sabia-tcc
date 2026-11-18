import type { ModoAtividade } from '@/types'
import type {
  CorrecaoQuestionario,
  EstadoLicaoAluno,
  LicaoDetalhe,
  LicaoResumo,
  PaginaAluno,
  ProgressoPagina,
  ProgressoVideo,
  PulsoVideo,
  TipoPaginaAluno,
  VistaPagina,
} from '@/types/licao'
import { formatarDuracao } from './youtube'

/** Regras puras das telas de lição do aluno. */

export const ROTULO_TIPO_ALUNO: Record<TipoPaginaAluno, string> = {
  TEXTO: 'Texto',
  IMAGEM_TEXTO: 'Imagem',
  VIDEO_YOUTUBE: 'Vídeo',
  VIDEO_UPLOAD: 'Vídeo',
  QUESTIONARIO: 'Questionário',
}

export const ROTULO_ESTADO_ALUNO: Record<EstadoLicaoAluno, string> = {
  NAO_INICIADA: 'Não iniciada',
  EM_ANDAMENTO: 'Em andamento',
  PRATICA_LIBERADA: 'Prática liberada',
  CONCLUIDA: 'Concluída',
}

export const ROTULO_MODO: Record<ModoAtividade, string> = {
  JOGO_ROBO: 'Jogo do Robô',
  BLOCOS: 'Programação em blocos',
}

/** Índice da primeira página não concluída; se todas estão concluídas (ou não há páginas), 0. */
export function paginaInicial(paginas: Pick<PaginaAluno, 'progresso'>[]): number {
  const i = paginas.findIndex((p) => !p.progresso.concluida)
  return i < 0 ? 0 : i
}

export interface Pendencia {
  indice: number
  rotulo: string
}

/** Páginas que faltam para liberar a prática, com o rótulo "Página N - Tipo". */
export function pendencias(paginas: Pick<PaginaAluno, 'tipo' | 'progresso'>[]): Pendencia[] {
  return paginas.flatMap((p, i) =>
    p.progresso.concluida ? [] : [{ indice: i, rotulo: `Página ${i + 1} - ${ROTULO_TIPO_ALUNO[p.tipo]}` }]
  )
}

export interface ResumoVideo {
  assistido: string
  necessario: string
  /** 0 a 100. */
  percentual: number
  conferido: boolean
}

/** Progresso do vídeo para a barra "Você assistiu X de Y". */
export function progressoVideo(v: ProgressoVideo): ResumoVideo {
  const percentual =
    v.segundosNecessarios > 0 ? Math.min(100, Math.floor((v.segundosCreditados * 100) / v.segundosNecessarios)) : 0
  return {
    assistido: formatarDuracao(Math.min(v.segundosCreditados, v.segundosNecessarios)),
    necessario: formatarDuracao(v.segundosNecessarios),
    percentual: v.conferido ? 100 : percentual,
    conferido: v.conferido,
  }
}

/** Todas as perguntas têm uma alternativa escolhida? */
export function todasRespondidas(escolhas: (number | null)[], totalPerguntas: number): boolean {
  return escolhas.length === totalPerguntas && escolhas.every((e) => e != null)
}

/** Corpo do envio (um índice por pergunta, na ordem) ou null se faltar alguma resposta. */
export function montarRespostas(escolhas: (number | null)[], totalPerguntas: number): number[] | null {
  return todasRespondidas(escolhas, totalPerguntas) ? (escolhas as number[]) : null
}

/** Turmas distintas das lições, na ordem em que aparecem (o filtro só aparece com duas ou mais). */
export function turmasDasLicoes(licoes: Pick<LicaoResumo, 'turmas'>[]): { id: number; nome: string }[] {
  const vistas = new Map<number, string>()
  for (const l of licoes) for (const t of l.turmas) if (!vistas.has(t.id)) vistas.set(t.id, t.nome)
  return [...vistas].map(([id, nome]) => ({ id, nome }))
}

// ---------- atualização do cache do detalhe a partir das respostas das ações ----------

function estadoDepois(detalhe: LicaoDetalhe, praticaLiberada: boolean): EstadoLicaoAluno {
  if (detalhe.concluidaEm) return 'CONCLUIDA'
  return praticaLiberada ? 'PRATICA_LIBERADA' : 'EM_ANDAMENTO'
}

function comPagina(
  detalhe: LicaoDetalhe,
  paginaId: number,
  praticaLiberada: boolean,
  progresso: (atual: ProgressoPagina) => ProgressoPagina
): LicaoDetalhe {
  return {
    ...detalhe,
    praticaLiberada,
    estado: estadoDepois(detalhe, praticaLiberada),
    paginas: detalhe.paginas.map((p) => (p.id === paginaId ? { ...p, progresso: progresso(p.progresso) } : p)),
  }
}

export function aplicarVista(detalhe: LicaoDetalhe, r: VistaPagina): LicaoDetalhe {
  return comPagina(detalhe, r.paginaId, r.praticaLiberada, (atual) => ({
    ...atual,
    concluida: atual.concluida || r.concluida,
  }))
}

export function aplicarPulso(detalhe: LicaoDetalhe, r: PulsoVideo): LicaoDetalhe {
  return comPagina(detalhe, r.paginaId, r.praticaLiberada, (atual) => ({
    ...atual,
    concluida: atual.concluida || r.conferido,
    video: {
      segundosCreditados: r.segundosCreditados,
      segundosNecessarios: r.segundosNecessarios,
      conferido: r.conferido,
    },
  }))
}

export function aplicarCorrecao(detalhe: LicaoDetalhe, r: CorrecaoQuestionario): LicaoDetalhe {
  return comPagina(detalhe, r.paginaId, r.praticaLiberada, (atual) => ({
    ...atual,
    concluida: atual.concluida || r.aprovadoNaPagina,
    questionario: { tentativas: r.tentativas, melhorPercentual: r.melhorPercentual, aprovado: r.aprovadoNaPagina },
  }))
}
