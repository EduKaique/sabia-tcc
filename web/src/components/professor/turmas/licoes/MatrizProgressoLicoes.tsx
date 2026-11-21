import Link from "next/link";
import type { MatrizPainel } from "@/lib/licoes/painelProgresso";
import { SeloEstado } from "./SeloEstado";

const th = "px-4 py-3 text-left align-bottom text-xs font-medium text-muted-foreground";

/** Desktop: nome do aluno fixo à esquerda e uma coluna por lição; a rolagem horizontal fica no contêiner. */
export function MatrizProgressoLicoes({ matriz }: { matriz: MatrizPainel }) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-max border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th
              scope="col"
              className={`${th} sticky left-0 z-10 border-b border-r border-border bg-card uppercase tracking-wide`}
            >
              Aluno
            </th>
            {matriz.colunas.map((c) => (
              <th key={c.id} scope="col" className={`${th} min-w-44 border-b border-border`}>
                <Link
                  href={c.href}
                  title={c.titulo}
                  className="block max-w-48 truncate text-sm font-semibold text-foreground hover:underline"
                >
                  {c.titulo}
                </Link>
                <span className="mt-0.5 block font-normal">{c.resumo}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matriz.linhas.map((linha) => (
            <tr key={linha.alunoId} className="group">
              <th
                scope="row"
                className="sticky left-0 z-10 max-w-56 truncate border-b border-r border-border bg-card px-4 py-3 text-left font-medium text-foreground group-last:border-b-0"
                title={linha.nome}
              >
                {linha.nome}
              </th>
              {linha.celulas.map((c) => (
                <td
                  key={c.licaoId}
                  aria-label={c.ariaLabel}
                  data-estado={c.estado}
                  className="border-b border-border px-4 py-3 align-top group-last:border-b-0"
                >
                  <SeloEstado celula={c} />
                  <span className="mt-1 block text-xs text-muted-foreground">{c.paginas}</span>
                  {c.questionario && (
                    <span className="block text-xs text-muted-foreground">{c.questionario}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
