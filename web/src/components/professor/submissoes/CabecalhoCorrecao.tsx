'use client'

import { useAtividade } from '@/hooks/useAtividades'
import { useTurmas } from '@/hooks/useTurmas'
import { formatarDataHora, parseDataUtc } from '@/lib/utils'
import type { SubmissaoProfessorDetalhe } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { SubmissaoStatusBadge } from '@/components/professor/atividades/detalhes/SubmissaoStatusBadge'

function tempoDesde(data: Date): string {
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
  const minutos = Math.round((data.getTime() - Date.now()) / 60000)
  if (Math.abs(minutos) < 60) return rtf.format(minutos, 'minute')
  const horas = Math.round(minutos / 60)
  if (Math.abs(horas) < 24) return rtf.format(horas, 'hour')
  return rtf.format(Math.round(horas / 24), 'day')
}

interface Props {
  submissao: SubmissaoProfessorDetalhe
}

export function CabecalhoCorrecao({ submissao }: Props) {
  const { data: atividade, isLoading } = useAtividade(String(submissao.atividadeId))
  const { data: turmas } = useTurmas()
  const turma = turmas?.find((t) => t.id === atividade?.turmaId)
  const dataEnvio = parseDataUtc(submissao.dataEnvio)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <SubmissaoStatusBadge status={submissao.status} />
        <span title={formatarDataHora(dataEnvio)}>Enviada {tempoDesde(dataEnvio)}</span>
      </div>
      {isLoading ? (
        <Skeleton className="h-9 w-80 rounded" />
      ) : (
        <h1 className="text-3xl font-bold text-foreground">{atividade?.titulo ?? 'Atividade'}</h1>
      )}
      <p className="text-muted-foreground">
        <span className="font-medium text-foreground">{submissao.alunoNome ?? 'Aluno sem nome'}</span>
        {turma && <> · {turma.nome}</>}
      </p>
    </div>
  )
}
