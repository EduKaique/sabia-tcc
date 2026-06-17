'use client'

import { Pencil, Trash2, Eye, EyeOff, Calendar, Award } from 'lucide-react'
import type { AtividadeAvaliativa } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Props {
  atividade: AtividadeAvaliativa
  turmaNome?: string
  onEdit: () => void
  onPublicar: () => void
  onDespublicar: () => void
  onDeletar: () => void
}

export function AtividadeCard({
  atividade,
  turmaNome,
  onEdit,
  onPublicar,
  onDespublicar,
  onDeletar,
}: Props) {
  const isPublicada = atividade.status === 'PUBLICADA'

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge
                variant="secondary"
                className={isPublicada ? 'bg-[--color-success-container] text-[--color-success]' : ''}
              >
                {isPublicada ? 'Publicada' : 'Rascunho'}
              </Badge>
              {atividade.eGeradaIa && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  IA
                </Badge>
              )}
            </div>
            <h3 className="text-base font-semibold text-foreground truncate">{atividade.titulo}</h3>
            {turmaNome && <p className="text-sm text-muted-foreground mt-0.5">{turmaNome}</p>}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={isPublicada ? onDespublicar : onPublicar}
              title={isPublicada ? 'Despublicar' : 'Publicar'}
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              {isPublicada ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              title="Editar"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Pencil size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDeletar}
              title="Excluir"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Award size={14} />
            {atividade.pontuacaoMaxima} pts
          </span>
          {atividade.dataEntrega && (
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(atividade.dataEntrega)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
