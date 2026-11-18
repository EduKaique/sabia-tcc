'use client'

import Link from 'next/link'
import { Archive, FileText, Pencil, Send, Undo2, Users } from 'lucide-react'
import { useDespublicarLicao, usePublicarLicao } from '@/hooks/useLicoesProfessor'
import { extrairErro } from '@/lib/licoes/errosLicao'
import type { LicaoProfessorResumo } from '@/types/licaoProfessor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ROTULO_ESTADO, ROTULO_MODO, VARIANTE_ESTADO, formatarDataUtc } from './estadoLicao'

interface Props {
  licao: LicaoProfessorResumo
  onArquivar: (licao: LicaoProfessorResumo) => void
}

export function LicaoCard({ licao, onArquivar }: Props) {
  const publicar = usePublicarLicao()
  const despublicar = useDespublicarLicao()
  const publicada = licao.estado === 'PUBLICADA'
  const acao = publicada ? despublicar : publicar
  const erro = publicar.error ?? despublicar.error

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

        {erro && <p className="text-xs text-destructive">{extrairErro(erro).mensagem}</p>}

        <div className="mt-auto flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/professor/licoes/${licao.id}/editar`}>
              <Pencil size={14} />
              Editar
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={acao.isPending}
            onClick={() => {
              publicar.reset()
              despublicar.reset()
              acao.mutate(licao.id)
            }}
          >
            {publicada ? <Undo2 size={14} /> : <Send size={14} />}
            {publicada ? 'Despublicar' : 'Publicar'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onArquivar(licao)} aria-label={`Arquivar ${licao.titulo}`}>
            <Archive size={14} />
            Arquivar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
