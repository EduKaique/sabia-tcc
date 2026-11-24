'use client'

import { useArquivarLicao } from '@/hooks/useLicoesProfessor'
import { extrairErro } from '@/lib/licoes/errosLicao'
import type { LicaoProfessorResumo } from '@/types/licaoProfessor'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Props {
  licao: Pick<LicaoProfessorResumo, 'id' | 'titulo'> | null
  onOpenChange: (open: boolean) => void
  /** Chamado depois de arquivar (ex.: voltar para a lista). */
  onArquivada?: () => void
}

export function ArquivarLicaoDialog({ licao, onOpenChange, onArquivada }: Props) {
  const arquivar = useArquivarLicao()

  const confirmar = () => {
    if (!licao) return
    arquivar.mutate(licao.id, {
      onSuccess: () => {
        onOpenChange(false)
        onArquivada?.()
      },
    })
  }

  return (
    <AlertDialog
      open={!!licao}
      onOpenChange={(open) => {
        if (!open) arquivar.reset()
        onOpenChange(open)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Arquivar esta lição?</AlertDialogTitle>
          <AlertDialogDescription>
            &quot;{licao?.titulo}&quot; sai da sua lista e deixa de aparecer para os alunos. Não é possível desfazer
            pela tela.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {arquivar.isError && <p className="text-sm text-destructive">{extrairErro(arquivar.error).mensagem}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={arquivar.isPending}>Cancelar</AlertDialogCancel>
          <Button variant="destructive" onClick={confirmar} disabled={arquivar.isPending}>
            {arquivar.isPending ? 'Arquivando...' : 'Arquivar'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
