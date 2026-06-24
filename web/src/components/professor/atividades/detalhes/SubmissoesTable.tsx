'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, File, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSubmissoes } from '@/hooks/useSubmissoes'
import type { StatusSubmissao } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlunoAvatar } from './AlunoAvatar'
import { SubmissaoStatusBadge } from './SubmissaoStatusBadge'

const ACTION_STATUSES: StatusSubmissao[] = ['PENDENTE', 'EM_CORRECAO']

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

interface Props {
  atividadeId: string
  filtroPendentes: boolean
  onFiltrarPendentes: () => void
}

export function SubmissoesTable({ atividadeId, filtroPendentes, onFiltrarPendentes }: Props) {
  const [currentPage, setCurrentPage] = useState(0)
  const [buscaAluno, setBuscaAluno] = useState('')

  const { data, isLoading } = useSubmissoes(atividadeId, currentPage)

  const content = data?.content ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 1

  const filtradas = content
    .filter((s) => s.alunoNome.toLowerCase().includes(buscaAluno.toLowerCase()))
    .filter((s) => !filtroPendentes || s.status === 'PENDENTE')

  const startItem = currentPage * (data?.size ?? 5) + 1
  const endItem = Math.min(startItem + (data?.size ?? 5) - 1, totalElements)

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h2 className="text-xl font-semibold">Submissões dos Alunos</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              placeholder="Buscar aluno..."
              value={buscaAluno}
              onChange={(e) => setBuscaAluno(e.target.value)}
              className="pl-8 w-48"
            />
          </div>
          <Button
            variant={filtroPendentes ? 'default' : 'outline'}
            size="icon"
            onClick={onFiltrarPendentes}
            title="Filtrar pendentes"
          >
            <SlidersHorizontal size={16} />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Aluno
              </th>
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                Data de Entrega
              </th>
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </th>
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                Nota
              </th>
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Ação
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <Skeleton className="h-4 w-8" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-8 w-28 rounded" />
                    </td>
                  </tr>
                ))
              : filtradas.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <AlunoAvatar nome={s.alunoNome} fotoUrl={s.alunoFotoUrl} />
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{s.alunoNome}</p>
                          {s.nomeArquivo && (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 truncate">
                              <File size={11} />
                              {s.nomeArquivo}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      {s.dataEnvio ? (
                        <div>
                          <p className="text-sm text-foreground">{formatDateTime(s.dataEnvio)}</p>
                          {s.entregueComAtraso && (
                            <p className="text-xs text-red-500 mt-0.5">Entregue com atraso</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <SubmissaoStatusBadge status={s.status} />
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-sm text-foreground">
                        {s.nota != null ? s.nota : '--'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {s.status === 'CORRIGIDA' ? (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/professor/submissoes/${s.id}/corrigir`}>Revisar</Link>
                        </Button>
                      ) : ACTION_STATUSES.includes(s.status) ? (
                        <Button size="sm" asChild>
                          <Link href={`/professor/submissoes/${s.id}/corrigir`}>Corrigir Projeto</Link>
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          {totalElements > 0
            ? `Mostrando ${startItem}-${endItem} de ${totalElements} alunos`
            : 'Sem resultados'}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft size={15} />
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`h-8 w-8 rounded text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {page + 1}
            </button>
          ))}

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
          >
            <ChevronRight size={15} />
          </Button>
        </div>
      </div>
    </div>
  )
}
