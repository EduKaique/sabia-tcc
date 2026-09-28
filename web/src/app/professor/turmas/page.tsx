'use client'

import { useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { useTurmas } from '@/hooks/useTurmas'
import type { Turma } from '@/types'
import { TurmaCard } from '@/components/professor/turmas/TurmaCard'
import { TurmaFormDialog } from '@/components/professor/turmas/TurmaFormDialog'
import { ExcluirTurmaDialog } from '@/components/professor/turmas/ExcluirTurmaDialog'
import { LoadingSkeleton } from '@/components/professor/atividades/LoadingSkeleton'
import { Button } from '@/components/ui/button'

export default function TurmasPage() {
  const { data: turmas = [], isLoading } = useTurmas()
  const [formAberto, setFormAberto] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [turmaEmEdicao, setTurmaEmEdicao] = useState<Turma | null>(null)
  const [turmaParaExcluir, setTurmaParaExcluir] = useState<Turma | null>(null)

  const abrirCriacao = () => {
    setTurmaEmEdicao(null)
    setFormKey((k) => k + 1)
    setFormAberto(true)
  }

  const abrirEdicao = (turma: Turma) => {
    setTurmaEmEdicao(turma)
    setFormKey((k) => k + 1)
    setFormAberto(true)
  }

  return (
    <div className="px-8 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Turmas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie e gerencie as turmas em que você leciona.
          </p>
        </div>
        <Button onClick={abrirCriacao}>
          <Plus size={16} />
          Criar Turma
        </Button>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : turmas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 bg-primary/10 rounded-full mb-4">
            <Users size={32} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Nenhuma turma criada</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Crie sua primeira turma para convidar alunos.
          </p>
          <Button onClick={abrirCriacao}>Criar Turma</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {turmas.map((turma) => (
            <TurmaCard
              key={turma.id}
              turma={turma}
              onEditar={abrirEdicao}
              onExcluir={setTurmaParaExcluir}
            />
          ))}
        </div>
      )}

      <TurmaFormDialog
        key={formKey}
        open={formAberto}
        onOpenChange={setFormAberto}
        turma={turmaEmEdicao}
      />
      <ExcluirTurmaDialog
        key={turmaParaExcluir?.id ?? 'nenhuma'}
        turma={turmaParaExcluir}
        onOpenChange={(open) => !open && setTurmaParaExcluir(null)}
      />
    </div>
  )
}
