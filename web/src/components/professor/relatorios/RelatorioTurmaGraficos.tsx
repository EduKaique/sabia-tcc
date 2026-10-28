'use client'

import { CheckCircle2, Clock, Percent, Star } from 'lucide-react'
import { useDistribuicaoNotas, useStatusEntregas } from '@/hooks/useRelatorioTurma'
import type { AtividadeAvaliativa, FiltroPeriodoTurma } from '@/types'
import { DistribuicaoNotasChart } from './graficos/DistribuicaoNotasChart'
import { MediaAtividadesChart } from './graficos/MediaAtividadesChart'
import { NotasAlunosChart } from './graficos/NotasAlunosChart'
import { ProgressaoAlunosChart } from './graficos/ProgressaoAlunosChart'
import { StatusEntregasChart } from './graficos/StatusEntregasChart'
import { formatarPercentual } from './graficos/cores'

interface Props {
  turmaId: number
  periodo: FiltroPeriodoTurma
  atividade?: AtividadeAvaliativa
}

export function RelatorioTurmaGraficos({ turmaId, periodo, atividade }: Props) {
  const { data: distribuicao } = useDistribuicaoNotas(turmaId, periodo)
  const { data: status } = useStatusEntregas(turmaId, periodo)

  const entregues = status ? status.totalEsperado - status.naoEntregues : 0
  const taxaEntrega = status && status.totalEsperado > 0 ? (entregues / status.totalEsperado) * 100 : null

  const indicadores = [
    { label: 'Média da turma', valor: formatarPercentual(distribuicao?.mediaPercentual), icone: Star, cor: 'bg-yellow-50 text-yellow-600' },
    { label: 'Mediana', valor: formatarPercentual(distribuicao?.medianaPercentual), icone: Percent, cor: 'bg-blue-50 text-blue-600' },
    { label: 'Taxa de entrega', valor: formatarPercentual(taxaEntrega, 0), icone: CheckCircle2, cor: 'bg-green-50 text-green-600' },
    { label: 'Aguardando correção', valor: String((status?.pendentes ?? 0) + (status?.emCorrecao ?? 0)), icone: Clock, cor: 'bg-red-50 text-red-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {indicadores.map(({ label, valor, icone: Icone, cor }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className={`mb-3 inline-flex rounded-lg p-2 ${cor}`}>
              <Icone size={18} />
            </div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{valor}</p>
          </div>
        ))}
      </div>

      {periodo.atividadeId ? (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Atividade: <strong className="text-foreground">{atividade?.titulo ?? '...'}</strong>
          </p>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DistribuicaoNotasChart turmaId={turmaId} periodo={periodo} />
            <StatusEntregasChart turmaId={turmaId} periodo={periodo} />
          </div>
          <NotasAlunosChart turmaId={turmaId} periodo={periodo} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MediaAtividadesChart turmaId={turmaId} periodo={periodo} />
          <DistribuicaoNotasChart turmaId={turmaId} periodo={periodo} />
          <ProgressaoAlunosChart turmaId={turmaId} periodo={periodo} />
          <StatusEntregasChart turmaId={turmaId} periodo={periodo} />
        </div>
      )}
    </div>
  )
}
