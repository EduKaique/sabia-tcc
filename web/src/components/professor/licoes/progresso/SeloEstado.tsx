import type { AlunoRelatorio } from "@/lib/licoes/painelProgresso";
import { IconeEstado } from "./IconeEstado";

/** Selo com ícone, texto e cor do estado (nunca só a cor). */
export function SeloEstado({
  celula,
}: {
  celula: Pick<AlunoRelatorio, "classe" | "icone" | "textoEstado">;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${celula.classe}`}
    >
      <IconeEstado icone={celula.icone} size={12} />
      {celula.textoEstado}
    </span>
  );
}
