import { useMutation } from '@tanstack/react-query'
import {
  revisarSubmissaoComIa,
  type RevisarSubmissaoIaPayload,
} from '@/services/ia'

export function useRevisarSubmissaoIa() {
  return useMutation({
    mutationFn: (payload: RevisarSubmissaoIaPayload) => revisarSubmissaoComIa(payload),
  })
}