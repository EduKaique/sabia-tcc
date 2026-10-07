import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listarAlunosTurma,
  matricularAluno,
  desmatricularAluno,
  buscarAluno,
  type MatricularAlunoPayload,
} from "@/services/turmaAlunos";

const alunosKey = (turmaId: number) => ["turmas", turmaId, "alunos"];

export function useTurmaAlunos(turmaId: number) {
  return useQuery({
    queryKey: alunosKey(turmaId),
    queryFn: () => listarAlunosTurma(turmaId),
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
