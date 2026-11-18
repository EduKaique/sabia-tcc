"use client";

import { useExcluirCenario, mensagemErroCenario } from "@/hooks/useCenarios";
import type { CenarioSalvo } from "@/types/cenario";
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
  cenario: CenarioSalvo | null;
  onOpenChange: (open: boolean) => void;
}

export function ExcluirCenarioDialog({ cenario, onOpenChange }: Props) {
  const excluir = useExcluirCenario();

  const confirmar = () => {
    if (!cenario) return;
    excluir.mutate(cenario.id, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <AlertDialog open={!!cenario} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza que deseja excluir este cenário?</AlertDialogTitle>
          <AlertDialogDescription>
            O cenário &quot;{cenario?.nome}&quot; será excluído permanentemente. Atividades que já o
            usam não são alteradas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {excluir.isError && (
          <p className="text-sm text-destructive">{mensagemErroCenario(excluir.error)}</p>
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
