'use client'

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useDistribuicaoNotas } from '@/hooks/useRelatorioTurma'
import type { FiltroPeriodoTurma } from '@/types'
import { ChartCard } from './ChartCard'
import { CORES, formatarPercentual } from './cores'

const COR_FAIXA = [CORES.erro, CORES.laranja, CORES.amarelo, CORES.azul, CORES.verde]

interface Props {
  turmaId: number
  periodo: FiltroPeriodoTurma
}

export function DistribuicaoNotasChart({ turmaId, periodo }: Props) {
  const { data, isLoading, isError } = useDistribuicaoNotas(turmaId, periodo)

  return (
    <ChartCard
      titulo="Distribuição das notas"
      descricao="Quantas correções caíram em cada faixa de desempenho."
      isLoading={isLoading}
      isError={isError}
      vazio={!data || data.totalNotas === 0}
      mensagemVazio="Nenhuma submissão corrigida ainda."
      acoes={
        data && data.totalNotas > 0 ? (
          <div className="flex gap-3 text-right text-xs text-muted-foreground">
            <span>
              Média <strong className="block text-sm text-foreground">{formatarPercentual(data.mediaPercentual)}</strong>
            </span>
            <span>
              Mediana <strong className="block text-sm text-foreground">{formatarPercentual(data.medianaPercentual)}</strong>
            </span>
          </div>
        ) : undefined
      }
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data?.faixas ?? []} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CORES.grade} vertical={false} />
            <XAxis dataKey="faixa" unit="%" tick={{ fontSize: 12, fill: CORES.texto }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: CORES.texto }} tickLine={false} axisLine={false} />
            <Tooltip formatter={(v) => [`${v} correções`, 'Quantidade']} labelFormatter={(l) => `Faixa ${l}%`} />
            <Bar dataKey="quantidade" radius={[6, 6, 0, 0]}>
              {(data?.faixas ?? []).map((f, i) => (
                <Cell key={f.faixa} fill={COR_FAIXA[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
