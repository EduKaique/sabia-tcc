import { z } from "zod";

/** Schema da correção: nota de 0 até a pontuação máxima da atividade, com até 2 casas. */
export function criarCorrecaoSchema(maximo: number) {
  return z.object({
    nota: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.coerce
        .number({ invalid_type_error: "Informe a nota." })
        .min(0, "A nota mínima é 0.")
        .max(maximo, `A nota máxima desta atividade é ${maximo.toLocaleString("pt-BR")}.`)
        .refine((v) => /^\d+(\.\d{1,2})?$/.test(String(v)), "Use no máximo 2 casas decimais."),
    ),
    feedbackProfessor: z.string().trim().min(1, "O feedback é obrigatório."),
  });
}

type CorrecaoSchema = ReturnType<typeof criarCorrecaoSchema>;
export type CorrecaoFormInput = z.input<CorrecaoSchema>;
export type CorrecaoFormData = z.output<CorrecaoSchema>;
