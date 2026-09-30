import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buscarSubmissaoProfessor, corrigirSubmissao } from "@/services/submissoes";
import type { CorrigirSubmissaoPayload } from "@/types";

export function useSubmissaoProfessor(id: string) {
  return useQuery({
    queryKey: ["submissao-professor", id],
    queryFn: () => buscarSubmissaoProfessor(id),
    enabled: !!id,
    retry: false,
  });
}

export function useCorrigirSubmissao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CorrigirSubmissaoPayload }) =>
      corrigirSubmissao(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissao-professor"] });
      queryClient.invalidateQueries({ queryKey: ["submissoes"] });
      queryClient.invalidateQueries({ queryKey: ["atividade-detalhes"] });
    },
  });
}

export function mensagemErroSubmissao(err: unknown): string | null {
  if (!err) return null;
  const msg = (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro;
  return msg ?? "Não foi possível concluir a operação. Tente novamente.";
}
