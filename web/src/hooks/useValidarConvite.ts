'use client'

import { useMutation } from '@tanstack/react-query'
import { validarConvite } from '@/services/convites'

/** Mutation (e não query): a validação é disparada por ação do aluno ou ao abrir o link. */
export function useValidarConvite() {
  return useMutation({ mutationFn: validarConvite })
}
