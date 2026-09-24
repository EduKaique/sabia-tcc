"use client";

import { useExcluirTurma, mensagemErroTurma } from "@/hooks/useTurmas";
import type { Turma } from "@/types";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  turma: Turma | null;
  onOpenChange: (open: boolean) => void;
}

export function ExcluirTurmaDialog({ turma, onOpenChange }: Props) {
  const excluir = useExcluirTurma();

  const confirmar = () => {
    if (!turma) return;
    excluir.mutate(turma.id, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <AlertDialog open={!!turma} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza que deseja excluir esta turma?</AlertDialogTitle>
          <AlertDialogDescription>
            A turma &quot;{turma?.nome}&quot; será excluída permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {excluir.isError && (
          <p className="text-sm text-destructive">{mensagemErroTurma(excluir.error)}</p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluir.isPending}>Cancelar</AlertDialogCancel>
          <Button variant="destructive" onClick={confirmar} disabled={excluir.isPending}>
            {excluir.isPending ? "Excluindo..." : "Confirmar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
