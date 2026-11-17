import { CircleCheck, Info, TriangleAlert } from 'lucide-react'
import type { ResultadoPraticaRobo } from '@/lib/resultadoPratica'
import { TEXTO_FASE } from '@/components/aluno/editor/SemaforoRobo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/** Nota binária do Jogo do Robô: concluída = pontuação máxima; senão 0 (o professor ajusta no formulário). */
export function notaSugeridaRobo(resultado: ResultadoPraticaRobo, pontuacaoMaxima: number) {
  return resultado.concluida ? pontuacaoMaxima : 0
}

const TEXTO_ORIGEM = {
  servidor: 'Validado pelo servidor na entrega.',
  navegador: 'Calculado no seu navegador (entrega anterior à validação no servidor).',
} as const

interface Props {
  resultado: ResultadoPraticaRobo
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

/** Resultado da submissão do Jogo do Robô: o validado no servidor ou, em entregas antigas, o do navegador. */
export function PainelResultadoSimulacao({ resultado, pontuacaoMaxima }: Props) {
  const { posicaoFinal } = resultado
  const chegou = resultado.status === 'CHEGOU'
  const Icone = resultado.concluida ? CircleCheck : TriangleAlert

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultado da simulação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p
          className={
            resultado.concluida
              ? 'flex items-center gap-2 font-semibold text-foreground'
              : 'flex items-center gap-2 font-semibold text-destructive'
          }
        >
          <Icone size={18} aria-hidden="true" />
          {TEXTO_FASE[resultado.status]}
        </p>
        <p className="text-xs text-muted-foreground">{TEXTO_ORIGEM[resultado.origem]}</p>

        <dl className="space-y-2">
          <Linha rotulo="Chegou ao destino" valor={chegou ? 'Sim' : 'Não'} />
          <Linha rotulo="Blocos usados" valor={String(resultado.blocosUsados)} />
          {resultado.maxBlocos !== null && (
            <Linha
              rotulo="Blocos no projeto / limite"
              valor={`${resultado.totalBlocosWorkspace} / ${resultado.maxBlocos}`}
            />
          )}
          <Linha rotulo="Passos executados" valor={String(resultado.passosExecutados)} />
          {posicaoFinal && (
            <Linha
              rotulo="Posição final"
              valor={`linha ${posicaoFinal.linha + 1}, coluna ${posicaoFinal.coluna + 1}`}
            />
          )}
        </dl>

        {resultado.avisos.map((aviso) => (
          <p key={aviso} className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-destructive">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            {aviso}
          </p>
        ))}

        {resultado.motivo && (
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Mensagem ao aluno: </span>
            {resultado.motivo}
          </p>
        )}

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
            {notaSugeridaRobo(resultado, pontuacaoMaxima)}{' '}
            <span className="text-sm font-normal text-muted-foreground">de {pontuacaoMaxima}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
