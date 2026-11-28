import type { StatusSubmissao } from '@/types'

const config: Record<
  StatusSubmissao,
  { bg: string; text: string; indicator: React.ReactNode; label: string }
> = {
  PENDENTE: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    indicator: <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1" />,
    label: 'Pendente',
  },
  CORRIGIDA: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    indicator: <span className="mr-1">✓</span>,
    label: 'Corrigido',
  },
}

interface Props {
  status: StatusSubmissao
}

export function SubmissaoStatusBadge({ status }: Props) {
  const { bg, text, indicator, label } = config[status]
  return (
    <span className={`inline-flex items-center ${bg} ${text} rounded-full px-2 py-0.5 text-xs font-medium`}>
      {indicator}
      {label}
    </span>
  )
}
