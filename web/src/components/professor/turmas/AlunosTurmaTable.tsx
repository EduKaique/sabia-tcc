'use client'

import { useState } from 'react'
import { Search, Trash2, Users } from 'lucide-react'
import { useTurmaAlunos } from '@/hooks/useTurmaAlunos'
import { mensagemErroTurma } from '@/hooks/useTurmas'
import type { AlunoDaTurma, AlunoMatriculado } from '@/types'
import { AlunoAvatar } from '@/components/professor/atividades/detalhes/AlunoAvatar'
import { DesmatricularAlunoDialog } from './DesmatricularAlunoDialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

/** Minúsculas e sem acento, para a busca ignorar os dois. */
function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

const th = 'px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide'

interface Props {
  turmaId: number
}

export function AlunosTurmaTable({ turmaId }: Props) {
  const { data: alunos = [], isLoading, isError, error } = useTurmaAlunos(turmaId)
  const [busca, setBusca] = useState('')
  const [alunoParaRemover, setAlunoParaRemover] = useState<AlunoMatriculado | null>(null)

  const termo = normalizar(busca.trim())
  const filtrados = termo
    ? alunos.filter(
        (a) => normalizar(a.nome ?? '').includes(termo) || normalizar(a.matricula ?? '').includes(termo),
      )
    : alunos

  const nomeExibido = (a: AlunoDaTurma) => a.nome ?? `Aluno #${a.alunoId}`

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm min-w-0">
      <div className="flex flex-col gap-3 p-5 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">
          Alunos {!isLoading && !isError && <span className="text-muted-foreground">({alunos.length})</span>}
        </h2>
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder="Buscar por nome ou matrícula..."
            aria-label="Buscar aluno por nome ou matrícula"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-8 w-full sm:w-64"
          />
        </div>
      </div>

      {isError ? (
        <p className="p-8 text-center text-sm text-destructive">{mensagemErroTurma(error)}</p>
      ) : !isLoading && alunos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-primary/10 rounded-full mb-4">
            <Users size={32} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum aluno matriculado</h3>
          <p className="text-sm text-muted-foreground">
            Compartilhe o código de convite ou use &quot;Matricular aluno&quot;.
          </p>
        </div>
      ) : !isLoading && filtrados.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">
          Nenhum aluno encontrado para &quot;{busca.trim()}&quot;.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className={th}>Aluno</th>
                <th className={`${th} hidden sm:table-cell`}>Matrícula</th>
                <th className={`${th} hidden md:table-cell`}>Entrada</th>
                <th className={`${th} text-right`}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-5 py-4">
                        <Skeleton className="h-8 w-20 rounded ml-auto" />
                      </td>
                    </tr>
                  ))
                : filtrados.map((aluno) => (
                    <tr
                      key={aluno.alunoId}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <AlunoAvatar nome={aluno.nome} fotoUrl={null} avatarId={aluno.avatar} />
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{nomeExibido(aluno)}</p>
                            {aluno.matricula && (
                              <p className="text-xs text-muted-foreground truncate sm:hidden">
                                Matrícula {aluno.matricula}
                              </p>
                            )}
                            {aluno.trocaSenhaPendente && (
                              <Badge variant="secondary" className="mt-1">
                                Troca pendente
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell text-sm text-foreground">
                        {aluno.matricula ?? '--'}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell text-sm text-foreground">
                        {formatDate(aluno.ingressoEm)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            title="Remover da turma"
                            aria-label={`Remover ${nomeExibido(aluno)} da turma`}
                            onClick={() =>
                              setAlunoParaRemover({
                                alunoId: aluno.alunoId,
                                alunoNome: aluno.nome,
                                ingressoEm: aluno.ingressoEm,
                              })
                            }
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      <DesmatricularAlunoDialog
        key={alunoParaRemover?.alunoId ?? 'nenhum'}
        turmaId={turmaId}
        aluno={alunoParaRemover}
        onOpenChange={(open) => !open && setAlunoParaRemover(null)}
      />
    </div>
  )
}
