import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listarTurmas,
  criarTurma,
  atualizarTurma,
  excluirTurma,
  type TurmaPayload,
} from "@/services/turmas";

const QUERY_KEY = ["turmas"];

export function useTurmas() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: listarTurmas });
}

export function useCriarTurma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: criarTurma,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useAtualizarTurma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TurmaPayload }) =>
      atualizarTurma(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useExcluirTurma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: excluirTurma,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

/** Extrai a mensagem de erro do backend (`ErroResponse.erro`), ex.: a do 409. */
export function mensagemErroTurma(err: unknown): string | null {
  if (!err) return null;
  const msg = (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro;
  return msg ?? "Não foi possível concluir a operação. Tente novamente.";
}
