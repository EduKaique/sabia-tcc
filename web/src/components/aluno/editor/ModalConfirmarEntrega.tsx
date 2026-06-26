'use client'

import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

export function ModalConfirmarEntrega({ open, onClose, onConfirm, isLoading }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v && !isLoading) onClose() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Entregar Atividade?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja entregar? Após a entrega não será possível editar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={onClose}>
            Cancelar
          </AlertDialogCancel>
          <Button onClick={onConfirm} disabled={isLoading} className="gap-2">
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            {isLoading ? 'Enviando...' : 'Confirmar'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
