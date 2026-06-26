import { useQuery } from "@tanstack/react-query";
import { listarSubmissoes } from "@/services/submissoes";

export function useSubmissoes(atividadeId: string, page: number) {
  return useQuery({
    queryKey: ["submissoes", atividadeId, page],
    queryFn: () => listarSubmissoes(atividadeId, page),
    enabled: !!atividadeId,
  });
}
