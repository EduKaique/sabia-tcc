import { z } from 'zod'
import { isAvatarId } from '@/lib/avatares'

const IDADE_MAXIMA_ANOS = 120

/** Data local no formato do input type="date" (yyyy-MM-dd). */
export function dataISOLocal(data: Date = new Date()): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function limitesDataNascimento(): { min: string; max: string } {
  const hoje = new Date()
  const min = new Date(hoje)
  min.setFullYear(hoje.getFullYear() - IDADE_MAXIMA_ANOS)
  return { min: dataISOLocal(min), max: dataISOLocal(hoje) }
}

/**
 * Campos com defaultValues '' (nunca undefined): assim os erros de campo não abortam o
 * objeto e a checagem de "senhas iguais" roda junto com as demais.
 */
export const primeiroAcessoSchema = z
  .object({
    nomeCompleto: z
      .string()
      .trim()
      .min(1, 'Escreva seu nome completo.')
      .max(255, 'O nome pode ter no máximo 255 letras.'),
    matricula: z
      .string()
      .trim()
      .min(1, 'Escreva sua matrícula.')
      .max(255, 'A matrícula pode ter no máximo 255 caracteres.'),
    dataNascimento: z
      .string()
      .min(1, 'Escolha sua data de nascimento.')
      .refine((v) => v < dataISOLocal(), 'A data de nascimento precisa ser antes de hoje.')
      .refine((v) => v >= limitesDataNascimento().min, 'Confira o ano de nascimento.'),
    // Retorno anotado como boolean: um type guard estreitaria o tipo e o default '' não caberia.
    avatar: z.string().refine((v): boolean => isAvatarId(v), 'Escolha um avatar.'),
    email: z
      .string()
      .trim()
      .min(1, 'Escreva um e-mail.')
      .email('Confira o e-mail. Ele precisa ser assim: nome@email.com')
      .max(255, 'O e-mail pode ter no máximo 255 caracteres.'),
    senha: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.'),
    confirmarSenha: z.string().min(1, 'Digite a senha de novo.'),
  })
  .superRefine((dados, ctx) => {
    if (dados.confirmarSenha && dados.senha !== dados.confirmarSenha) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmarSenha'],
        message: 'As senhas não são iguais. Digite a mesma senha nos dois campos.',
      })
    }
  })

export type PrimeiroAcessoFormData = z.infer<typeof primeiroAcessoSchema>
export type CampoPrimeiroAcesso = keyof PrimeiroAcessoFormData

export const CAMPOS_PASSO_1 = ['nomeCompleto', 'matricula', 'dataNascimento', 'avatar'] as const
export const CAMPOS_PASSO_2 = ['email', 'senha', 'confirmarSenha'] as const

export const VALORES_INICIAIS: PrimeiroAcessoFormData = {
  nomeCompleto: '',
  matricula: '',
  dataNascimento: '',
  avatar: '',
  email: '',
  senha: '',
  confirmarSenha: '',
}
