import { z } from 'zod'

/** Troca da própria senha (obrigatória ou voluntária). Mesmo mínimo do cadastro do aluno. */
export const trocarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Digite sua senha atual.'),
    novaSenha: z.string().min(8, 'A nova senha deve ter pelo menos 8 caracteres.'),
    confirmarSenha: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    message: 'As senhas não coincidem.',
    path: ['confirmarSenha'],
  })

export type TrocarSenhaFormData = z.infer<typeof trocarSenhaSchema>
