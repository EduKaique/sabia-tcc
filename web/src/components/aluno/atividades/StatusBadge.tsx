import { Badge } from '@/components/ui/badge'
import type { StatusAtividadeAluno } from '@/types/atividade'

interface Props {
  status: StatusAtividadeAluno
}

const config: Record<StatusAtividadeAluno, { label: string; className: string }> = {
  PENDENTE: {
    label: 'Pendente',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  EM_ANDAMENTO: {
    label: 'Em Andamento',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  ENTREGUE: {
    label: 'Em Avaliação',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  CORRIGIDA: {
    label: '✓ Corrigido',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
}

export function StatusBadge({ status }: Props) {
  const { label, className } = config[status]
  return (
    <Badge variant="outline" className={`text-xs font-medium ${className}`}>
      {label}
    </Badge>
  )
}
