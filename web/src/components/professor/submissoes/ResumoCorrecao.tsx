import { formatarDataHora, parseDataUtc } from '@/lib/utils'
import type { Correcao } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  correcao: Correcao
}

export function ResumoCorrecao({ correcao }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Avaliação Final</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nota</p>
          <p className="text-3xl font-bold text-foreground">{correcao.nota}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Feedback</p>
          <p className="whitespace-pre-wrap text-sm text-foreground">{correcao.feedbackProfessor || '--'}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Avaliada em {formatarDataHora(parseDataUtc(correcao.avaliadaEm))}. A nota não pode ser alterada.
        </p>
      </CardContent>
    </Card>
  )
}
