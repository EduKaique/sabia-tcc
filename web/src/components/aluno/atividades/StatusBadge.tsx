import { cn } from '@/lib/utils'
import type { StatusAtividadeAluno } from '@/types/atividade'

interface Props {
  status: StatusAtividadeAluno
}

const config: Record<StatusAtividadeAluno, { label: string; className: string }> = {
  PENDENTE: {
    label: 'Pendente',
    className: 'border-sabia-amarelo bg-sabia-amarelo/25',
  },
  EM_ANDAMENTO: {
    label: 'Em Andamento',
    className: 'border-sabia-azul bg-sabia-azul-claro',
  },
  ENTREGUE: {
    label: 'Em Avaliação',
    className: 'border-sabia-laranja bg-sabia-laranja/15',
  },
  CORRIGIDA: {
    label: '✓ Corrigido',
    className: 'border-sabia-verde bg-sabia-verde/20',
  },
}

export function StatusBadge({ status }: Props) {
  const { label, className } = config[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border-2 px-3 py-0.5 text-xs font-bold text-tinta',
        className,
      )}
    >
      {label}
    </span>
  )
}
