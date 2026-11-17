import { lerCenario } from '@/lib/cenariosRobo'
import type { RevisarSubmissaoIaPayload } from '@/services/ia'
import type { AtividadeAvaliativa, RelatorioIa, SubmissaoProfessorDetalhe } from '@/types'

export const AVISO_RELATORIO_ROBO = 'Apoio à correção; a nota é decisão do professor.'
export const SEM_PROJETO_ROBO = 'Não há projeto do aluno para analisar.'
export const SEM_CENARIO_ROBO = 'O cenário desta atividade não pôde ser lido; o relatório de IA não está disponível.'
export const SEM_ANALISE_ROBO =
  'O servidor não conseguiu analisar o programa desta entrega; o relatório de IA não está disponível.'

type AtividadeDoPedido = Pick<
  AtividadeAvaliativa,
  'titulo' | 'descricao' | 'pontuacaoMaxima' | 'gabaritoEstadoJson' | 'cenarioJson'
>
type SubmissaoDoPedido = Pick<SubmissaoProfessorDetalhe, 'estadoJson' | 'analiseRobo'>

/**
 * Monta o pedido do relatório de IA do Jogo do Robô a partir do detalhe da submissão: o cenário da
 * atividade e a análise do servidor (métricas = campos planos de analiseRobo, sem o pseudocódigo).
 * Sem projeto, cenário legível ou análise, devolve a mensagem para o botão ficar indisponível.
 */
export function montarPedidoRelatorioRobo(
  atividade: AtividadeDoPedido,
  submissao: SubmissaoDoPedido,
): { payload: RevisarSubmissaoIaPayload } | { indisponivel: string } {
  if (!submissao.estadoJson) return { indisponivel: SEM_PROJETO_ROBO }
  const cenario = lerCenario(atividade.cenarioJson)
  if (!cenario) return { indisponivel: SEM_CENARIO_ROBO }
  if (!submissao.analiseRobo) return { indisponivel: SEM_ANALISE_ROBO }

  const { pseudocodigo, ...metricas } = submissao.analiseRobo
  return {
    payload: {
      atividade: {
        titulo: atividade.titulo,
        descricao: atividade.descricao,
        pontuacaoMaxima: atividade.pontuacaoMaxima,
        gabaritoEstadoJson: atividade.gabaritoEstadoJson,
      },
      submissaoEstadoJson: submissao.estadoJson,
      contextoRobo: { cenario, metricas, pseudocodigo },
    },
  }
}

/** Relatório sem a nota sugerida: no robô, a nota é decisão do professor. */
export function relatorioSemNota(relatorio: RelatorioIa): RelatorioIa {
  const semNota = { ...relatorio }
  delete semNota.notaSugerida
  return semNota
}
