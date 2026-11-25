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
import { alertaErro, botaoPrincipal, botaoSecundario, cartao } from '@/lib/estilos'
import { extrairErroSandbox } from '@/lib/sandbox/errosSandbox'
import { useExcluirProjetoSandbox } from '@/hooks/useProjetosSandbox'
import type { ProjetoSandboxResumo } from '@/types/projetoSandbox'

interface Props {
  projeto: ProjetoSandboxResumo | null
  onClose: () => void
}

export function ExcluirProjetoDialog({ projeto, onClose }: Props) {
  const excluir = useExcluirProjetoSandbox()

  const fechar = () => {
    if (excluir.isPending) return
    excluir.reset()
    onClose()
  }

  return (
    <AlertDialog open={!!projeto} onOpenChange={(v) => { if (!v) fechar() }}>
      <AlertDialogContent className={cn(nunito.className, cartao, 'ring-0 text-tinta')}>
        <AlertDialogHeader>
          <AlertDialogTitle className={cn(fredoka.className, 'text-2xl font-bold text-tinta')}>
            Excluir projeto?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base font-medium text-tinta-apoio">
            O projeto &quot;{projeto?.nome}&quot; será apagado e não poderá ser recuperado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {excluir.isError && (
          <p role="alert" className={alertaErro}>
            {extrairErroSandbox(excluir.error).mensagem}
          </p>
        )}
        <AlertDialogFooter>
          <button type="button" disabled={excluir.isPending} onClick={fechar} className={botaoSecundario}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={excluir.isPending}
            onClick={() => {
              if (projeto) excluir.mutate(projeto.id, { onSuccess: () => { excluir.reset(); onClose() } })
            }}
            className={cn(botaoPrincipal, fredoka.className, 'min-h-12 bg-sabia-erro-claro py-2 text-base')}
          >
            {excluir.isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {excluir.isPending ? 'Excluindo...' : 'Excluir'}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
