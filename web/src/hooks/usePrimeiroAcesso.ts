'use client'

import { useMutation } from '@tanstack/react-query'
import { primeiroAcesso } from '@/services/auth'

export function usePrimeiroAcesso() {
  return useMutation({ mutationFn: primeiroAcesso })
}
