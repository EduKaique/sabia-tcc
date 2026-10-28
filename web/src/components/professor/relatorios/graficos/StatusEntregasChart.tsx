'use client'

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useStatusEntregas } from '@/hooks/useRelatorioTurma'
import type { FiltroPeriodoTurma } from '@/types'
import { ChartCard } from './ChartCard'
import { CORES } from './cores'

interface Props {
  turmaId: number
  periodo: FiltroPeriodoTurma
}

export function StatusEntregasChart({ turmaId, periodo }: Props) {
  const { data, isLoading, isError } = useStatusEntregas(turmaId, periodo)

  const fatias = data
    ? [
        { nome: 'Corrigidas', valor: data.corrigidas, cor: CORES.verde },
        { nome: 'Em correção', valor: data.emCorrecao, cor: CORES.azul },
        { nome: 'Aguardando correção', valor: data.pendentes, cor: CORES.amarelo },
        { nome: 'Não entregues', valor: data.naoEntregues, cor: CORES.cinza },
      ].filter((f) => f.valor > 0)
    : []

  return (
    <ChartCard
      titulo="Situação das entregas"
      descricao="Panorama de tudo que era esperado dos alunos nas atividades publicadas."
      isLoading={isLoading}
      isError={isError}
      vazio={!data || data.totalEsperado === 0}
      mensagemVazio="A turma ainda não tem alunos ou atividades publicadas."
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={fatias} dataKey="valor" nameKey="nome" innerRadius={60} outerRadius={95} paddingAngle={2}>
              {fatias.map((f) => (
                <Cell key={f.nome} fill={f.cor} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [`${v} entregas`, '']} />
            <Legend iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {data && data.entreguesComAtraso > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {data.entreguesComAtraso} de {data.entreguesNoPrazo + data.entreguesComAtraso} entregas foram feitas após o prazo.
        </p>
      )}
    </ChartCard>
  )
}
