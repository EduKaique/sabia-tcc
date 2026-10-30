'use client'

import { useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useAtividades } from '@/hooks/useAtividades'
import { useRelatorioProfessor } from '@/hooks/useRelatorio'
import { useTurmas } from '@/hooks/useTurmas'
import type { RelatorioRequest } from '@/types'
import { Button } from '@/components/ui/button'
import { RelatorioFilters } from '@/components/professor/relatorios/RelatorioFilters'
import { RelatorioResumo } from '@/components/professor/relatorios/RelatorioResumo'
import { RelatorioTurmaGraficos } from '@/components/professor/relatorios/RelatorioTurmaGraficos'
import { RelatorioTurmasTable } from '@/components/professor/relatorios/RelatorioTurmasTable'

export default function RelatoriosPage() {
  const [filters, setFilters] = useState<RelatorioRequest>({ tipo: 'GERAL' })
  const { data: turmas = [] } = useTurmas()
  const { data: atividades = [] } = useAtividades()
  const turmaSelecionada = filters.turmaId
  const { data: relatorio, isLoading, isError, refetch } = useRelatorioProfessor(
    filters,
    turmaSelecionada == null,
  )
  const periodo = {
    atividadeId: filters.atividadeId,
    dataInicio: filters.dataInicio,
    dataFim: filters.dataFim,
  }

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe o desempenho dos alunos e das turmas em um só lugar.
        </p>
      </div>

      <div className="mb-6">
        <RelatorioFilters
          value={filters}
          turmas={turmas}
          atividades={atividades ?? []}
          onChange={setFilters}
        />
      </div>

      {turmaSelecionada != null ? (
        <RelatorioTurmaGraficos
          turmaId={turmaSelecionada}
          periodo={periodo}
          atividade={atividades?.find((a) => a.id === filters.atividadeId)}
        />
      ) : isLoading ? (
        <div className="space-y-6" aria-label="Carregando relatório">
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
          <AlertCircle className="mb-3 text-destructive" size={32} />
          <h2 className="font-semibold text-foreground">Não foi possível carregar o relatório</h2>
          <p className="mt-1 text-sm text-muted-foreground">Verifique os filtros e tente novamente.</p>
          <Button className="mt-5" variant="outline" onClick={() => refetch()}>
            <RefreshCw size={16} />
            Tentar novamente
          </Button>
        </div>
      ) : relatorio ? (
        <div className="space-y-6">
          <RelatorioResumo relatorio={relatorio} />
          <RelatorioTurmasTable turmas={relatorio.turmas} />
        </div>
      ) : null}
    </div>
  )
}
