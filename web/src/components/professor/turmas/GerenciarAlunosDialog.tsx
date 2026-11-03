"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, UserPlus } from "lucide-react";
import { buscaAlunoSchema, type BuscaAlunoFormData } from "@/lib/schemas/matriculaSchema";
import { useBuscarAluno, useMatricularAluno } from "@/hooks/useTurmaAlunos";
import { mensagemErroTurma } from "@/hooks/useTurmas";
import type { Turma } from "@/types";
import { AlunoAvatar } from "@/components/professor/atividades/detalhes/AlunoAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  turma: Turma | null;
  onOpenChange: (open: boolean) => void;
}

export function GerenciarAlunosDialog({ turma, onOpenChange }: Props) {
  const turmaId = turma?.id ?? 0;
  const buscar = useBuscarAluno();
  const matricular = useMatricularAluno(turmaId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BuscaAlunoFormData>({
    resolver: zodResolver(buscaAlunoSchema),
    defaultValues: { termo: "" },
  });

  const onBuscar = (data: BuscaAlunoFormData) => {
    matricular.reset();
    buscar.mutate(data.termo);
  };

  const encontrado = buscar.data;

  const onMatricular = () => {
    if (!encontrado) return;
    matricular.mutate(
      { alunoId: encontrado.id, alunoNome: encontrado.nome },
      {
        onSuccess: () => {
          buscar.reset();
          reset();
        },
      },
    );
  };

  return (
    <Dialog open={!!turma} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Matricular aluno</DialogTitle>
          <DialogDescription>
            Busque o aluno e matricule-o em &quot;{turma?.nome}&quot;.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onBuscar)} className="space-y-1.5" noValidate>
          <Label htmlFor="termo-aluno">E-mail, CPF ou matrícula</Label>
          <div className="flex gap-2">
            <Input
              id="termo-aluno"
              placeholder="aluno@sabia.edu, 123.456.789-00 ou 20260001"
              {...register("termo")}
            />
            <Button type="submit" variant="outline" disabled={buscar.isPending}>
              <Search size={16} />
              {buscar.isPending ? "Buscando..." : "Buscar"}
            </Button>
          </div>
          {errors.termo && <p className="text-xs text-destructive">{errors.termo.message}</p>}
          {buscar.isError && (
            <p className="text-sm text-destructive">{mensagemErroTurma(buscar.error)}</p>
          )}
        </form>

        {encontrado && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
            <AlunoAvatar nome={encontrado.nome} fotoUrl={null} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{encontrado.nome}</p>
              <p className="truncate text-xs text-muted-foreground">
                {encontrado.email ?? `Matrícula ${encontrado.matricula}`}
              </p>
            </div>
            <Button size="sm" onClick={onMatricular} disabled={matricular.isPending}>
              <UserPlus size={14} />
              {matricular.isPending ? "Matriculando..." : "Matricular"}
            </Button>
          </div>
        )}
        {matricular.isError && (
          <p className="text-sm text-destructive">{mensagemErroTurma(matricular.error)}</p>
        )}
        {matricular.isSuccess && (
          <p className="text-sm text-foreground">
            {matricular.data.alunoNome ?? "Aluno"} foi matriculado(a) na turma.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
