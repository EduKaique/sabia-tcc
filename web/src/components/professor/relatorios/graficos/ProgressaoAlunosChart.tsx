'use client'

import { useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useProgressaoAlunos } from '@/hooks/useRelatorioTurma'
import type { FiltroPeriodoTurma } from '@/types'
import { ChartCard } from './ChartCard'
import { abreviar, CORES, formatarPercentual, PALETA_ALUNOS } from './cores'

const PADRAO_DESTAQUES = 3

interface Props {
  turmaId: number
  periodo: FiltroPeriodoTurma
}

export function ProgressaoAlunosChart({ turmaId, periodo }: Props) {
  const { data, isLoading, isError } = useProgressaoAlunos(turmaId, periodo)
  const [escolhidos, setEscolhidos] = useState<number[] | null>(null)

  const alunos = useMemo(() => data?.alunos ?? [], [data])

  // Por padrão destaca quem tem a menor média: são os alunos que pedem atenção.
  const selecionados = useMemo(() => {
    if (escolhidos) return escolhidos
    return alunos
      .filter((a) => a.mediaPercentual != null)
      .sort((a, b) => (a.mediaPercentual ?? 0) - (b.mediaPercentual ?? 0))
      .slice(0, PADRAO_DESTAQUES)
      .map((a) => a.alunoId)
  }, [escolhidos, alunos])

  const destacados = alunos.filter((a) => selecionados.includes(a.alunoId))

  const linhas = (data?.atividades ?? []).map((atividade, i) => {
    const linha: Record<string, string | number | null> = {
      titulo: atividade.titulo,
      mediaTurma: data?.mediaTurma[i] ?? null,
    }
    destacados.forEach((aluno) => {
      linha[`aluno-${aluno.alunoId}`] = aluno.notasPercentuais[i] ?? null
    })
    return linha
  })

  const alternar = (id: number) =>
    setEscolhidos(selecionados.includes(id) ? selecionados.filter((x) => x !== id) : [...selecionados, id])

  const semNotas = !data || data.mediaTurma.every((m) => m == null)

  return (
    <ChartCard
      titulo="Progressão das notas"
      descricao="Evolução do desempenho (% da pontuação máxima) ao longo das atividades. Compare alunos com a média da turma."
      isLoading={isLoading}
      isError={isError}
      vazio={semNotas}
      mensagemVazio="Nenhuma submissão corrigida ainda."
      className="lg:col-span-2"
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {alunos.map((aluno) => {
          const indice = selecionados.indexOf(aluno.alunoId)
          const ativo = indice >= 0
          return (
            <button
              key={aluno.alunoId}
              type="button"
              onClick={() => alternar(aluno.alunoId)}
              aria-pressed={ativo}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                ativo ? 'border-transparent text-white' : 'border-border text-muted-foreground hover:bg-muted'
              }`}
              style={ativo ? { backgroundColor: PALETA_ALUNOS[indice % PALETA_ALUNOS.length] } : undefined}
            >
              {aluno.alunoNome}
              {aluno.mediaPercentual != null && <span className="ml-1 opacity-80">· {aluno.mediaPercentual.toFixed(0)}%</span>}
            </button>
          )
        })}
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={linhas} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CORES.grade} vertical={false} />
            <XAxis
              dataKey="titulo"
              tickFormatter={(v: string) => abreviar(v, 16)}
              tick={{ fontSize: 12, fill: CORES.texto }}
              tickLine={false}
            />
            <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: CORES.texto }} tickLine={false} axisLine={false} />
            <Tooltip formatter={(v) => (v == null ? 'Sem nota' : formatarPercentual(Number(v)))} />
            <Legend iconType="circle" />
            <Line
              type="monotone"
              dataKey="mediaTurma"
              name="Média da turma"
              stroke={CORES.texto}
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={{ r: 3 }}
              connectNulls
            />
            {destacados.map((aluno, i) => (
              <Line
                key={aluno.alunoId}
                type="monotone"
                dataKey={`aluno-${aluno.alunoId}`}
                name={aluno.alunoNome}
                stroke={PALETA_ALUNOS[i % PALETA_ALUNOS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {escolhidos == null && destacados.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Exibindo por padrão os {destacados.length} alunos com menor média. Clique nos nomes para alterar.
        </p>
      )}
    </ChartCard>
  )
}
