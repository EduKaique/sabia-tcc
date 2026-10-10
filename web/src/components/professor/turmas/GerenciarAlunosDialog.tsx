"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Trash2, UserPlus } from "lucide-react";
import { buscaAlunoSchema, type BuscaAlunoFormData } from "@/lib/schemas/matriculaSchema";
import { useBuscarAluno, useMatricularAluno, useTurmaAlunos } from "@/hooks/useTurmaAlunos";
import { mensagemErroTurma } from "@/hooks/useTurmas";
import type { AlunoMatriculado, Turma } from "@/types";
import { AlunoAvatar } from "@/components/professor/atividades/detalhes/AlunoAvatar";
import { DesmatricularAlunoDialog } from "./DesmatricularAlunoDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

interface Props {
  turma: Turma | null;
  onOpenChange: (open: boolean) => void;
}

export function GerenciarAlunosDialog({ turma, onOpenChange }: Props) {
  const turmaId = turma?.id ?? 0;
  const { data: alunos = [], isLoading } = useTurmaAlunos(turmaId);
  const buscar = useBuscarAluno();
  const matricular = useMatricularAluno(turmaId);
  const [alunoParaRemover, setAlunoParaRemover] = useState<AlunoMatriculado | null>(null);

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
    <>
      <Dialog open={!!turma} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Alunos da turma</DialogTitle>
            <DialogDescription>
              Matricule ou remova alunos de &quot;{turma?.nome}&quot;.
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
                <p className="truncate text-xs text-muted-foreground">{encontrado.email}</p>
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

          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">
              Matriculados ({alunos.length})
            </h4>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : alunos.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum aluno matriculado nesta turma.
              </p>
            ) : (
              <ul className="max-h-72 divide-y divide-border overflow-y-auto">
                {alunos.map((aluno) => (
                  <li key={aluno.alunoId} className="flex items-center gap-3 py-2">
                    <AlunoAvatar nome={aluno.alunoNome} fotoUrl={null} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {aluno.alunoNome ?? `Aluno #${aluno.alunoId}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Desde {formatDate(aluno.ingressoEm)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setAlunoParaRemover(aluno)}
                      aria-label={`Remover ${aluno.alunoNome ?? `aluno #${aluno.alunoId}`}`}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <DesmatricularAlunoDialog
        key={alunoParaRemover?.alunoId ?? "nenhum"}
        turmaId={turmaId}
        aluno={alunoParaRemover}
        onOpenChange={(open) => !open && setAlunoParaRemover(null)}
      />
    </>
  );
}
