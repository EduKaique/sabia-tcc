'use client'

import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { fredoka, nunito } from '@/lib/fontesHome'
import { botaoPrincipal, botaoSecundario, cartao } from '@/lib/estilos'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

export function ModalConfirmarEntrega({ open, onClose, onConfirm, isLoading }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v && !isLoading) onClose() }}>
      <AlertDialogContent className={cn(nunito.className, cartao, 'ring-0 text-tinta')}>
        <AlertDialogHeader>
          <AlertDialogTitle className={cn(fredoka.className, 'text-2xl font-bold text-tinta')}>
            Entregar Atividade?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base font-medium text-tinta-apoio">
            Tem certeza que deseja entregar? Após a entrega não será possível editar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <button type="button" disabled={isLoading} onClick={onClose} className={botaoSecundario}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(botaoPrincipal, fredoka.className, 'min-h-12 py-2 text-base')}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {isLoading ? 'Enviando...' : 'Confirmar'}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
