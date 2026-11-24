'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2, UserPlus } from 'lucide-react'
import { useTurmas } from '@/hooks/useTurmas'
import { etapaEnsinoLabels } from '@/lib/schemas/turmaSchema'
import { TurmaMeta } from '@/components/professor/turmas/TurmaCard'
import { TurmaFormDialog } from '@/components/professor/turmas/TurmaFormDialog'
import { ExcluirTurmaDialog } from '@/components/professor/turmas/ExcluirTurmaDialog'
import { GerenciarAlunosDialog } from '@/components/professor/turmas/GerenciarAlunosDialog'
import { AlunosTurmaTable } from '@/components/professor/turmas/AlunosTurmaTable'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function TurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: turmas = [], isLoading } = useTurmas()
  // Só turmas do professor logado vêm em useTurmas: id de outro professor cai em "não encontrada".
  const turma = turmas.find((t) => String(t.id) === id) ?? null

  const [editando, setEditando] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [excluindo, setExcluindo] = useState(false)
  const [matriculando, setMatriculando] = useState(false)

  const voltar = (
    <Link
      href="/professor/turmas"
      className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft size={14} />
      Voltar para Turmas
    </Link>
  )

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-8 space-y-6">
        {voltar}
        <div className="space-y-3">
          <Skeleton className="h-9 w-72 rounded" />
          <Skeleton className="h-5 w-56 rounded" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!turma) {
    return (
      <div className="px-4 py-6 sm:px-8 space-y-6">
        {voltar}
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h1 className="text-lg font-semibold text-foreground mb-1">Turma não encontrada</h1>
          <p className="text-sm text-muted-foreground">
            Ela pode ter sido excluída ou não pertence a você.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-8 space-y-6 min-w-0">
      {voltar}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-foreground break-words">{turma.nome}</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-3">{etapaEnsinoLabels[turma.etapa]}</p>
          <TurmaMeta turma={turma} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setMatriculando(true)}>
            <UserPlus size={16} />
            Matricular aluno
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setFormKey((k) => k + 1)
              setEditando(true)
            }}
          >
            <Pencil size={16} />
            Editar turma
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setExcluindo(true)}
          >
            <Trash2 size={16} />
            Excluir turma
          </Button>
        </div>
      </div>

      <AlunosTurmaTable turmaId={turma.id} />

      <TurmaFormDialog key={formKey} open={editando} onOpenChange={setEditando} turma={turma} />
      <ExcluirTurmaDialog
        turma={excluindo ? turma : null}
        onOpenChange={(open) => !open && setExcluindo(false)}
        onExcluida={() => router.replace('/professor/turmas')}
      />
      <GerenciarAlunosDialog
        key={matriculando ? 'aberto' : 'fechado'}
        turma={matriculando ? turma : null}
        onOpenChange={(open) => !open && setMatriculando(false)}
      />
    </div>
  )
}
