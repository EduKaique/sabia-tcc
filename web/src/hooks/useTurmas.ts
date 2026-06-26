import { useQuery } from "@tanstack/react-query";
import { listarTurmas } from "@/services/turmas";

export function useTurmas() {
  return useQuery({ queryKey: ["turmas"], queryFn: listarTurmas });
}
