import { useMutation } from "@tanstack/react-query";
import { gerarAtividadeRoboComIa, type GerarAtividadeRoboPayload } from "@/services/ia";

export function useGerarAtividadeRoboIa() {
  return useMutation({
    mutationFn: (payload: GerarAtividadeRoboPayload) => gerarAtividadeRoboComIa(payload),
  });
}
