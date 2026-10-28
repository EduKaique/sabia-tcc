import { CircleCheck, Info, TriangleAlert } from 'lucide-react'
import type { Simulacao } from '@/lib/simuladorRobo'
import type { CenarioRobo } from '@/types'
import { TEXTO_FASE } from '@/components/aluno/editor/SemaforoRobo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/** Nota binária do Jogo do Robô: chegou = pontuação máxima; senão 0 (o professor ajusta no formulário). */
export function notaSugeridaRobo(simulacao: Simulacao, pontuacaoMaxima: number) {
  return simulacao.resultado.chegou ? pontuacaoMaxima : 0
}

interface Props {
  simulacao: Simulacao
  cenario: CenarioRobo
  pontuacaoMaxima: number
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{rotulo}</dt>
      <dd className="font-medium text-foreground">{valor}</dd>
    </div>
  )
}

/** Resultado da submissão do Jogo do Robô, calculado pelo mesmo simulador que o aluno usou. */
export function PainelResultadoSimulacao({ simulacao, cenario, pontuacaoMaxima }: Props) {
  const { resultado } = simulacao
  const { posicaoFinal } = resultado
  const Icone = resultado.chegou ? CircleCheck : TriangleAlert

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultado da simulação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p
          className={
            resultado.chegou
              ? 'flex items-center gap-2 font-semibold text-foreground'
              : 'flex items-center gap-2 font-semibold text-destructive'
          }
        >
          <Icone size={18} aria-hidden="true" />
          {TEXTO_FASE[resultado.status]}
        </p>

        <dl className="space-y-2">
          <Linha rotulo="Chegou ao destino" valor={resultado.chegou ? 'Sim' : 'Não'} />
          <Linha
            rotulo="Blocos usados"
            valor={
              cenario.maxBlocos
                ? `${resultado.blocosUsados} / ${cenario.maxBlocos}`
                : String(resultado.blocosUsados)
            }
          />
          <Linha rotulo="Passos executados" valor={String(resultado.passosExecutados)} />
          <Linha
            rotulo="Posição final"
            valor={`linha ${posicaoFinal.linha + 1}, coluna ${posicaoFinal.coluna + 1}`}
          />
        </dl>

        {resultado.blocosSoltos > 0 && (
          <p className="flex items-start gap-2 rounded-md bg-muted p-2 text-muted-foreground">
            <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            Há {resultado.blocosSoltos} bloco(s) solto(s) que não foram executados.
          </p>
        )}

        <div className="border-t border-border pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Nota sugerida
          </p>
          <p className="text-2xl font-bold text-foreground">
            {notaSugeridaRobo(simulacao, pontuacaoMaxima)}{' '}
            <span className="text-sm font-normal text-muted-foreground">de {pontuacaoMaxima}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
