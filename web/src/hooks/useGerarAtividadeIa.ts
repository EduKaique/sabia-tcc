import { useMutation } from '@tanstack/react-query'
import {
  gerarAtividadeComIa,
  type GerarAtividadeIaPayload,
} from '@/service/ia'

export function useGerarAtividadeIa() {
  return useMutation({
    mutationFn: (payload: GerarAtividadeIaPayload) => gerarAtividadeComIa(payload),
  })
}
