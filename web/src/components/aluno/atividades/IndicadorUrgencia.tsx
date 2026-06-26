import type { StatusAtividadeAluno } from '@/types/atividade'

interface UrgencyInfo {
  text: string
  urgent: boolean
}

export function getInfoUrgencia(
  dataLimite: string,
  status: StatusAtividadeAluno,
): UrgencyInfo {
  const deadline = new Date(dataLimite)
  const now = new Date()
  const diffMs = deadline.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  const isPending = status === 'PENDENTE' || status === 'EM_ANDAMENTO'

  if (diffMs <= 0) {
    return { text: 'Prazo encerrado', urgent: isPending }
  }

  if (diffHours < 24 && isPending) {
    const hours = deadline.getHours().toString().padStart(2, '0')
    const minutes = deadline.getMinutes().toString().padStart(2, '0')
    return { text: `! Expira hoje (${hours}:${minutes})`, urgent: true }
  }

  if (diffDays === 1) {
    return { text: 'Expira amanhã', urgent: false }
  }

  if (diffDays <= 7) {
    return { text: `Expira em ${diffDays} dias`, urgent: false }
  }

  const formatted = deadline.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  })
  return { text: formatted, urgent: false }
}
