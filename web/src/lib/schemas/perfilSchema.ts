import { z } from 'zod'
import { isAvatarId } from '@/lib/avatares'

/** Edição do próprio perfil. Espelha o EditarPerfilRequest do auth-service (nome 3 a 255, com trim). */
export const perfilSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, 'O nome deve ter entre 3 e 255 caracteres.')
    .max(255, 'O nome deve ter entre 3 e 255 caracteres.'),
  /** Só aluno. Ausente no formulário do professor. */
  avatar: z
    .string()
    .refine((v): boolean => isAvatarId(v), 'Avatar inválido.')
    .optional(),
})

export type PerfilFormData = z.infer<typeof perfilSchema>
