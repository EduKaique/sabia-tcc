import { z } from "zod";

export const tiposAtividade = [
  "ATIVIDADE_AVALIATIVA",
  "ATIVIDADE_TRILHA",
] as const;

export const atividadeSchema = z.object({
  titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres").max(200),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  tipoAtividade: z.enum(tiposAtividade).optional(),
  turmaId: z.coerce.number({ required_error: "Selecione uma turma" }).gt(0, "Selecione uma turma"),
  pontuacaoMaxima: z.coerce
    .number({ invalid_type_error: "Informe a pontuação" })
    .int()
    .min(1, "Mínimo 1 ponto")
    .max(100, "Máximo 100 pontos"),
  dataEntrega: z.preprocess(
    (val) => {
      if (val === "" || val === null) return undefined;
      return val;
    },
    z.coerce
      .date({
        required_error: "A data é obrigatória",
        invalid_type_error: "Formato de data inválido",
      })
      .refine(
        (dataValidadada) => {
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);

          return dataValidadada > hoje;
        },
        {
          message: "A data deve ser posterior ao dia de hoje",
        }
      )
      .optional()
  ),
  gabaritoEstadoJson: z.string().optional(),
});

export type AtividadeFormInput = z.input<typeof atividadeSchema>
export type AtividadeFormData = z.infer<typeof atividadeSchema>;
