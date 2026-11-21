import { CheckCircle2, Clock, Minus, Unlock } from "lucide-react";
import type { IconeEstado as Icone } from "@/lib/licoes/painelProgresso";

const ICONES = {
  traco: Minus,
  relogio: Clock,
  "cadeado-aberto": Unlock,
  check: CheckCircle2,
} as const;

/** Ícone decorativo do estado: o texto ao lado (ou o aria-label da célula) é que informa. */
export function IconeEstado({ icone, size = 14 }: { icone: Icone; size?: number }) {
  const Componente = ICONES[icone];
  return <Componente size={size} aria-hidden="true" data-icone={icone} className="shrink-0" />;
}
