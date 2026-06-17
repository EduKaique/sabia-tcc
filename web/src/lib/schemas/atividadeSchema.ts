import { z } from 'zod'

export const atividadeSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(200),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  turmaId: z.string().uuid('Selecione uma turma'),
  pontuacaoMaxima: z.coerce
    .number({ invalid_type_error: 'Informe a pontuação' })
    .int()
    .min(1, 'Mínimo 1 ponto')
    .max(100, 'Máximo 100 pontos'),
  dataEntrega: z.string().nullable().optional(),
})

export type AtividadeFormData = z.infer<typeof atividadeSchema>
