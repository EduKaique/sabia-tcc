import { z } from 'zod'

export const loginSchema = z.object({
  login: z.string().trim().min(1, 'Escreva sua matrícula ou e-mail.'),
  senha: z.string().min(1, 'Digite sua senha.'),
})

export type LoginFormData = z.infer<typeof loginSchema>
