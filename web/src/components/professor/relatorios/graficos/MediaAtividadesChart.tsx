'use client'

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useMediasAtividades } from '@/hooks/useRelatorioTurma'
import type { FiltroPeriodoTurma } from '@/types'
import { ChartCard } from './ChartCard'
import { abreviar, CORES, formatarPercentual } from './cores'

interface Props {
  turmaId: number
  periodo: FiltroPeriodoTurma
}

export function MediaAtividadesChart({ turmaId, periodo }: Props) {
  const { data = [], isLoading, isError } = useMediasAtividades(turmaId, periodo)

  const dados = data.map((a) => ({
    titulo: a.atividadeTitulo,
    media: a.mediaPercentual,
    entrega: a.taxaEntrega,
  }))

  return (
    <ChartCard
      titulo="Média e entregas por atividade"
      descricao="Média das notas (% da pontuação máxima) comparada à taxa de entrega de cada atividade."
      isLoading={isLoading}
      isError={isError}
      vazio={data.length === 0}
      mensagemVazio="Nenhuma atividade publicada para esta turma."
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CORES.grade} vertical={false} />
            <XAxis
              dataKey="titulo"
              tickFormatter={(v: string) => abreviar(v)}
              tick={{ fontSize: 12, fill: CORES.texto }}
              tickLine={false}
            />
            <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: CORES.texto }} tickLine={false} axisLine={false} />
            <Tooltip formatter={(v) => (v == null ? 'Sem notas' : formatarPercentual(Number(v)))} />
            <Legend iconType="circle" />
            <Bar dataKey="media" name="Média das notas" fill={CORES.azul} radius={[6, 6, 0, 0]} />
            <Bar dataKey="entrega" name="Taxa de entrega" fill={CORES.verde} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
