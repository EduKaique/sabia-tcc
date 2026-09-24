import { z } from "zod";

export const etapasEnsino = ["ANOS_INICIAIS", "ANOS_FINAIS", "MEDIO", "TECNICO"] as const;
export const turnos = ["MANHA", "TARDE", "NOITE", "INTEGRAL"] as const;

export const etapaEnsinoLabels: Record<(typeof etapasEnsino)[number], string> = {
  ANOS_INICIAIS: "Ensino Fundamental — Anos Iniciais",
  ANOS_FINAIS: "Ensino Fundamental — Anos Finais",
  MEDIO: "Ensino Médio",
  TECNICO: "Ensino Técnico",
};

export const turnoLabels: Record<(typeof turnos)[number], string> = {
  MANHA: "Manhã",
  TARDE: "Tarde",
  NOITE: "Noite",
  INTEGRAL: "Integral",
};

export const turmaSchema = z.object({
  nome: z.string().trim().min(1, "O nome da turma é obrigatório."),
  etapa: z.enum(etapasEnsino, { required_error: "A modalidade de ensino é obrigatória." }),
  anoSerie: z.string().trim().min(1, "O ano/série é obrigatório."),
  turno: z.enum(turnos, { required_error: "O turno é obrigatório." }),
});

export type TurmaFormData = z.infer<typeof turmaSchema>;
