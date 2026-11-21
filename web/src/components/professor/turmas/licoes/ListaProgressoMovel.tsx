import Link from "next/link";
import type { CartaoAluno } from "@/lib/licoes/painelProgresso";
import { SeloEstado } from "./SeloEstado";

/** Celular: um cartão por aluno com as lições em linhas, sem rolagem horizontal. */
export function ListaProgressoMovel({ cartoes }: { cartoes: CartaoAluno[] }) {
  return (
    <ul className="space-y-3 p-4">
      {cartoes.map((aluno) => (
        <li key={aluno.alunoId} className="rounded-lg border border-border p-3">
          <h3 className="break-words font-semibold text-foreground">{aluno.nome}</h3>
          <ul className="mt-2 divide-y divide-border">
            {aluno.licoes.map((l) => (
              <li
                key={l.licaoId}
                aria-label={l.ariaLabel}
                data-estado={l.estado}
                className="py-2 first:pt-0 last:pb-0"
              >
                <Link
                  href={l.href}
                  className="block break-words text-sm font-medium text-foreground hover:underline"
                >
                  {l.titulo}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <SeloEstado celula={l} />
                  <span>{l.paginas}</span>
                  {l.questionario && <span>{l.questionario}</span>}
                </div>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
