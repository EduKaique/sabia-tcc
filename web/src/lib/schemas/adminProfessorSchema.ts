import { z } from 'zod'

function isValidCpf(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 11 || /^([0-9])\1{10}$/.test(digits)) return false

  const calculateDigit = (length: number) => {
    let sum = 0
    for (let index = 0; index < length; index += 1) {
      sum += Number(digits[index]) * (length + 1 - index)
    }
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  return calculateDigit(9) === Number(digits[9]) && calculateDigit(10) === Number(digits[10])
}

export const adminProfessorSchema = z.object({
  nomeCompleto: z
    .string()
    .trim()
    .min(3, 'Informe o nome completo.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.')
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, 'Use apenas letras e espaços.'),
  cpf: z
    .string()
    .refine(isValidCpf, 'Informe um CPF válido.'),
  email: z
    .string()
    .trim()
    .email('Informe um e-mail válido.')
    .max(150, 'O e-mail deve ter no máximo 150 caracteres.'),
})

export type AdminProfessorFormData = z.infer<typeof adminProfessorSchema>

export function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function cpfDigits(value: string) {
  return value.replace(/\D/g, '')
}
