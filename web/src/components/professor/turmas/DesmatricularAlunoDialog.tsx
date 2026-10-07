"use client";

import { useDesmatricularAluno } from "@/hooks/useTurmaAlunos";
import { mensagemErroTurma } from "@/hooks/useTurmas";
import type { AlunoMatriculado } from "@/types";
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
  turmaId: number;
  aluno: AlunoMatriculado | null;
  onOpenChange: (open: boolean) => void;
}

export function DesmatricularAlunoDialog({ turmaId, aluno, onOpenChange }: Props) {
  const desmatricular = useDesmatricularAluno(turmaId);

  const confirmar = () => {
    if (!aluno) return;
    desmatricular.mutate(aluno.alunoId, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <AlertDialog open={!!aluno} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover aluno da turma?</AlertDialogTitle>
          <AlertDialogDescription>
            {aluno?.alunoNome ?? `Aluno #${aluno?.alunoId}`} perderá o acesso às atividades desta
            turma. As entregas e notas já registradas continuam salvas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {desmatricular.isError && (
          <p className="text-sm text-destructive">{mensagemErroTurma(desmatricular.error)}</p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={desmatricular.isPending}>Cancelar</AlertDialogCancel>
          <Button variant="destructive" onClick={confirmar} disabled={desmatricular.isPending}>
            {desmatricular.isPending ? "Removendo..." : "Remover"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
