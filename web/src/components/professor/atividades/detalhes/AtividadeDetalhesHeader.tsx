"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, Calendar, Pencil, Trash2 } from 'lucide-react'
import type { AtividadeDetalhes } from '@/types'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  usePublicarAtividade,
  useDespublicarAtividade,
  useDeletarAtividade,
} from '@/hooks/useAtividades'
import { useState } from 'react'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(iso),
  )
}

interface Props {
  atividade: AtividadeDetalhes
}

export function AtividadeDetalhesHeader({ atividade }: Props) {
  const router = useRouter()
  const [isPublicada, setIsPublicada] = useState(atividade.status === 'PUBLICADA')

  const publicar = usePublicarAtividade()
  const despublicar = useDespublicarAtividade()
  const deletar = useDeletarAtividade()

  function handleTogglePublicacao(checked: boolean) {
    setIsPublicada(checked)

    if (!checked) { 
      despublicar.mutate(atividade.id, { 
        onSuccess: () => router.refresh(),
        onError: () => setIsPublicada(true) 
      })
    } else { 
      publicar.mutate(atividade.id, { 
        onSuccess: () => router.refresh(),
        onError: () => setIsPublicada(false) 
      })
    }
  }

  function handleDeletar() {
    deletar.mutate(atividade.id, {
      onSuccess: () => router.push('/professor/atividades'),
    })
  }

  return (
    <div className="flex items-start justify-between gap-8">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {isPublicada ? (
            <span className="inline-flex items-center bg-[#ECFDF5] text-[#065F46] rounded-full px-2.5 py-1 text-xs font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1.5" />
              Publicada
            </span>
          ) : (
            <span className="inline-flex items-center bg-[#FFFBEB] text-[#92400E] rounded-full px-2.5 py-1 text-xs font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F59E0B] mr-1.5" />
              Rascunho
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 border border-border bg-muted rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <CalendarDays size={12} />
            {atividade.turmaNome}
          </span>

          {atividade.dataEntrega && (
            <span className="inline-flex items-center gap-1.5 border border-border bg-muted rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Calendar size={12} />
              Prazo: {formatDate(atividade.dataEntrega)}
            </span>
          )}
        </div>

        <h1 className="text-4xl font-bold text-primary leading-tight mb-3">
          {atividade.titulo}
        </h1>

        <p className="text-muted-foreground max-w-xl">{atividade.descricao}</p>
      </div>

      <div className="flex items-center gap-3 shrink-0 pt-1">
        <div className="flex items-center gap-2">
          <Switch
            checked={isPublicada}
            onCheckedChange={handleTogglePublicacao}
            disabled={publicar.isPending || despublicar.isPending}
            aria-label={isPublicada ? 'Despublicar atividade' : 'Publicar atividade'}
          />
          <span className="text-sm text-muted-foreground">
            {isPublicada ? 'Publicada' : 'Rascunho'}
          </span>
        </div>

        <Button asChild>
          <Link href={`/professor/atividades/${atividade.id}/editar`}>
            <Pencil size={16} />
            Editar Atividade
          </Link>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" aria-label="Remover atividade">
              <Trash2 size={16} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover atividade</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A atividade e todos os seus dados serão removidos permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletar}
                disabled={deletar.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
