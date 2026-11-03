import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listarAlunosDaTurma,
  matricularAluno,
  desmatricularAluno,
  buscarAluno,
  redefinirSenhaAluno,
  type MatricularAlunoPayload,
  type RedefinirSenhaAlunoPayload,
} from "@/services/turmaAlunos";

const alunosKey = (turmaId: number) => ["turmas", turmaId, "alunos"];

export function useTurmaAlunos(turmaId: number) {
  return useQuery({
    queryKey: alunosKey(turmaId),
    queryFn: () => listarAlunosDaTurma(turmaId),
    enabled: !!turmaId,
  });
}

export function useMatricularAluno(turmaId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MatricularAlunoPayload) => matricularAluno(turmaId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: alunosKey(turmaId) }),
  });
}

export function useDesmatricularAluno(turmaId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alunoId: number) => desmatricularAluno(turmaId, alunoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: alunosKey(turmaId) }),
  });
}

export function useBuscarAluno() {
  return useMutation({ mutationFn: buscarAluno });
}

/** O resultado (senha gerada) fica só no estado do modal; a lista é atualizada pelo badge de troca. */
export function useRedefinirSenhaAluno(turmaId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ alunoId, payload }: { alunoId: number; payload: RedefinirSenhaAlunoPayload }) =>
      redefinirSenhaAluno(turmaId, alunoId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: alunosKey(turmaId) }),
  });
}
