import { z } from "zod";

export const correcaoSchema = z.object({
  nota: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce
      .number({ invalid_type_error: "Informe a nota." })
      .min(0, "A nota mínima é 0.")
      .max(100, "A nota máxima é 100.")
      .refine((v) => /^\d+(\.\d{1,2})?$/.test(String(v)), "Use no máximo 2 casas decimais."),
  ),
  feedbackProfessor: z.string().trim().min(1, "O feedback é obrigatório."),
});

export type CorrecaoFormInput = z.input<typeof correcaoSchema>;
export type CorrecaoFormData = z.output<typeof correcaoSchema>;
