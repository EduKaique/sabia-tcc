import { BookOpen, CheckCircle2, GraduationCap, Star, Users } from 'lucide-react'
import type { RelatorioProfessor } from '@/types'

interface Props {
  relatorio: RelatorioProfessor
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function RelatorioResumo({ relatorio }: Props) {
  const cards = [
    { label: 'Alunos', value: formatNumber(relatorio.totalAlunos), icon: GraduationCap, color: 'text-blue-600 bg-blue-50' },
    { label: 'Turmas', value: formatNumber(relatorio.totalTurmas), icon: Users, color: 'text-violet-600 bg-violet-50' },
    { label: 'Atividades', value: formatNumber(relatorio.totalAtividades), icon: BookOpen, color: 'text-orange-600 bg-orange-50' },
    { label: 'Entregas', value: formatNumber(relatorio.totalEntregas), icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
    { label: 'Média geral', value: relatorio.mediaGeral == null ? '--' : relatorio.mediaGeral.toFixed(1), icon: Star, color: 'text-yellow-600 bg-yellow-50' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-start justify-between">
            <div className={`rounded-lg p-2 ${color}`}>
              <Icon size={18} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        </div>
      ))}
    </div>
  )
}
