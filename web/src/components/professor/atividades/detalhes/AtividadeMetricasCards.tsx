import { Users, Star, ClipboardList } from 'lucide-react'
import type { AtividadeDetalhes, SubmissaoItem } from '@/types'

interface Props {
  atividade: AtividadeDetalhes
  submissoes: SubmissaoItem[]
  onFiltrarPendentes: () => void
}

export function AtividadeMetricasCards({ atividade, submissoes, onFiltrarPendentes }: Props) {
  const { totalEntregas, totalAlunos, mediaTurma, pontuacaoMaxima } = atividade
  const taxa = totalAlunos > 0 ? Math.round((totalEntregas / totalAlunos) * 100) : 0
  const progressWidth = totalAlunos > 0 ? (totalEntregas / totalAlunos) * 100 : 0
  const pendentes = submissoes.filter((s) => s.status === 'PENDENTE').length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Card 1 — Entregas Totais */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="bg-blue-50 text-blue-600 rounded-lg p-2">
            <Users size={20} />
          </div>
          <span className="text-sm text-muted-foreground">Taxa: {taxa}%</span>
        </div>
        <p className="text-sm text-muted-foreground mb-1">Entregas Totais</p>
        <p className="text-2xl font-bold text-foreground mb-3">
          {totalEntregas}{' '}
          <span className="text-base font-normal text-muted-foreground">/ {totalAlunos}</span>
        </p>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      {/* Card 2 — Média da Turma */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="bg-yellow-50 text-yellow-500 rounded-lg p-2">
            <Star size={20} />
          </div>
          <span className="inline-flex items-center bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs font-medium">
            +0.5
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-1">Média da Turma</p>
        <p className="text-2xl font-bold text-foreground">
          {mediaTurma != null ? mediaTurma.toFixed(1) : '--'}{' '}
          <span className="text-base font-normal text-muted-foreground">/ {pontuacaoMaxima}</span>
        </p>
      </div>

      {/* Card 3 — Correções Pendentes */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="bg-red-50 text-red-500 rounded-lg p-2">
            <ClipboardList size={20} />
          </div>
          {pendentes > 0 && (
            <span className="inline-flex items-center bg-red-100 text-red-600 rounded-full px-2 py-0.5 text-xs font-medium">
              Ação Necessária
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-1">Correções Pendentes</p>
        <p className="text-2xl font-bold text-red-500 mb-3">
          {pendentes}{' '}
          <span className="text-base font-normal text-muted-foreground">projetos</span>
        </p>
        {pendentes > 0 && (
          <button
            onClick={onFiltrarPendentes}
            className="text-primary text-sm font-medium hover:underline"
          >
            Filtrar pendentes
          </button>
        )}
      </div>
    </div>
  )
}
