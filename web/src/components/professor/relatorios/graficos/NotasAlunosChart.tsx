'use client'

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useProgressaoAlunos } from '@/hooks/useRelatorioTurma'
import type { FiltroPeriodoTurma } from '@/types'
import { ChartCard } from './ChartCard'
import { abreviar, CORES, formatarPercentual } from './cores'

interface Props {
  turmaId: number
  periodo: FiltroPeriodoTurma
}

const corDaNota = (nota: number) => (nota >= 70 ? CORES.verde : nota >= 50 ? CORES.amarelo : CORES.erro)

export function NotasAlunosChart({ turmaId, periodo }: Props) {
  const { data, isLoading, isError } = useProgressaoAlunos(turmaId, periodo)

  const notas = (data?.alunos ?? [])
    .map((aluno) => ({ nome: aluno.alunoNome, nota: aluno.notasPercentuais[0] }))
    .filter((item): item is { nome: string; nota: number } => item.nota != null)
    .sort((a, b) => b.nota - a.nota)

  return (
    <ChartCard
      titulo="Nota de cada aluno"
      descricao="Desempenho individual na atividade, em % da pontuação máxima."
      isLoading={isLoading}
      isError={isError}
      vazio={notas.length === 0}
      mensagemVazio="Nenhuma submissão corrigida nesta atividade."
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={notas} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CORES.grade} vertical={false} />
            <XAxis
              dataKey="nome"
              tickFormatter={(nome: string) => abreviar(nome)}
              tick={{ fontSize: 12, fill: CORES.texto }}
              tickLine={false}
            />
            <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: CORES.texto }} tickLine={false} axisLine={false} />
            <Tooltip formatter={(v) => [formatarPercentual(Number(v)), 'Nota']} />
            <Bar dataKey="nota" radius={[6, 6, 0, 0]}>
              {notas.map((item) => (
                <Cell key={item.nome} fill={corDaNota(item.nota)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
