import { useQuery } from "@tanstack/react-query";
import { buscarProgressoLicoesTurma } from "@/services/licoesProfessor";

const statusDe = (err: unknown) => (err as { response?: { status?: number } })?.response?.status;

/** Painel de progresso das lições da turma. Sempre recarrega ao voltar o foco (o progresso muda enquanto se olha). */
export function useProgressoLicoesTurma(turmaId: number) {
  return useQuery({
    queryKey: ["licoes-progresso", turmaId],
    queryFn: () => buscarProgressoLicoesTurma(turmaId),
    enabled: !!turmaId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    // 403 e 404 não melhoram tentando de novo.
    retry: (falhas, err) => statusDe(err) !== 403 && statusDe(err) !== 404 && falhas < 1,
  });
}
