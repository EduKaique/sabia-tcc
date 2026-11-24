'use client'

import Link from 'next/link'
import { Eye, FileText, Users } from 'lucide-react'
import type { LicaoProfessorResumo } from '@/types/licaoProfessor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ROTULO_ESTADO, ROTULO_MODO, VARIANTE_ESTADO, formatarDataUtc } from './estadoLicao'

/** Card da lista: resumo da lição e "Ver lição" (ações e progresso dos alunos ficam na página da lição). */
export function LicaoCard({ licao }: { licao: LicaoProfessorResumo }) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-sm">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-foreground">{licao.titulo}</h3>
            <p className="truncate text-sm text-muted-foreground">{licao.conceito}</p>
          </div>
          <Badge variant={VARIANTE_ESTADO[licao.estado]}>{ROTULO_ESTADO[licao.estado]}</Badge>
        </div>

        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>{ROTULO_MODO[licao.modo]}</li>
          <li className="flex items-center gap-1">
            <FileText size={12} aria-hidden />
            {licao.quantidadePaginas} {licao.quantidadePaginas === 1 ? 'página' : 'páginas'}
          </li>
          <li className="flex items-center gap-1">
            <Users size={12} aria-hidden />
            {licao.turmas.length > 0 ? licao.turmas.map((t) => t.nome).join(', ') : 'Nenhuma turma vinculada'}
          </li>
          <li>Atualizada em {formatarDataUtc(licao.atualizadaEm)}</li>
        </ul>

        <div className="mt-auto">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/professor/licoes/${licao.id}`}>
              <Eye size={14} />
              Ver lição
              <span className="sr-only">: {licao.titulo}</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
