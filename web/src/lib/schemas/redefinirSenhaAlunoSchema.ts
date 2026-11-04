import { z } from 'zod'

/** Redefinição pelo professor. Senha digitada: 8 a 64 caracteres, sem espaço nas pontas. */
export const redefinirSenhaAlunoSchema = z
  .object({
    modo: z.enum(['ALEATORIA', 'DIGITADA']),
    senha: z.string(),
    exigirTroca: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.modo !== 'DIGITADA') return
    const erro =
      data.senha.length === 0
        ? 'Digite a nova senha.'
        : data.senha !== data.senha.trim()
          ? 'A senha não pode começar nem terminar com espaço.'
          : data.senha.length < 8 || data.senha.length > 64
            ? 'A senha deve ter entre 8 e 64 caracteres.'
            : null
    if (erro) ctx.addIssue({ code: z.ZodIssueCode.custom, message: erro, path: ['senha'] })
  })

export type RedefinirSenhaAlunoFormData = z.infer<typeof redefinirSenhaAlunoSchema>
