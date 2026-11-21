import {
  ESTADOS_PAINEL,
  classeEstado,
  iconeEstado,
  rotuloEstado,
} from "@/lib/licoes/painelProgresso";
import { IconeEstado } from "./IconeEstado";

export function LegendaEstados() {
  return (
    <ul aria-label="Legenda dos estados" className="flex flex-wrap gap-2">
      {ESTADOS_PAINEL.map((estado) => (
        <li
          key={estado}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${classeEstado(estado)}`}
        >
          <IconeEstado icone={iconeEstado(estado)} size={12} />
          {rotuloEstado(estado)}
        </li>
      ))}
    </ul>
  );
}
