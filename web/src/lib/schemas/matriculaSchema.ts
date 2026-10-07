import { z } from "zod";

/** `termo` pode ser e-mail, CPF (com ou sem máscara) ou matrícula; o backend detecta o tipo. */
export const buscaAlunoSchema = z.object({
  termo: z.string().trim().min(1, "Informe o e-mail, CPF ou matrícula do aluno."),
});

export type BuscaAlunoFormData = z.infer<typeof buscaAlunoSchema>;
