import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listarCenarios,
  criarCenario,
  atualizarCenario,
  excluirCenario,
} from "@/services/cenarios";
import type { CenarioSalvoPayload } from "@/types/cenario";

const QUERY_KEY = ["cenarios"];

export function useCenarios() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: listarCenarios });
}

export function useCriarCenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: criarCenario,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useAtualizarCenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CenarioSalvoPayload }) =>
      atualizarCenario(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useExcluirCenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: excluirCenario,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

/**
 * Mensagem do backend (`ErroResponse.erro`, ex.: cenário sem caminho no 400 ou limite no 409);
 * no 400 de validação de campos, a primeira mensagem de `campos`.
 */
export function mensagemErroCenario(err: unknown): string | null {
  if (!err) return null;
  const data = (err as { response?: { data?: { erro?: string; campos?: Record<string, string> } } })
    ?.response?.data;
  const campo = data?.campos ? Object.values(data.campos)[0] : undefined;
  return campo ?? data?.erro ?? "Não foi possível concluir a operação. Tente novamente.";
}
