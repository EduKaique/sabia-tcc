"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertCircle, BookOpen, RefreshCw, Users } from "lucide-react";
import { useProgressoLicoesTurma } from "@/hooks/useProgressoLicoesTurma";
import { montarListaMovel, montarMatriz, resumoTurma } from "@/lib/licoes/painelProgresso";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LegendaEstados } from "./LegendaEstados";
import { ListaProgressoMovel } from "./ListaProgressoMovel";
import { MatrizProgressoLicoes } from "./MatrizProgressoLicoes";

/** Seção "Lições" da página da turma: progresso dos alunos matriculados nas lições publicadas. */
export function PainelLicoesTurma({ turmaId }: { turmaId: number }) {
  const { data, isLoading, isError, isFetching, refetch } = useProgressoLicoesTurma(turmaId);
  const matriz = useMemo(() => (data ? montarMatriz(data) : null), [data]);
  const cartoes = useMemo(() => (data ? montarListaMovel(data) : []), [data]);

  const temMatriz = !!data && data.licoes.length > 0 && data.alunos.length > 0;

  return (
    <section
      aria-labelledby="titulo-licoes-turma"
      className="min-w-0 rounded-xl border border-border bg-card shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-border p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="titulo-licoes-turma" className="text-xl font-semibold">
              Lições
            </h2>
            {data && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {resumoTurma(data.totalAlunos, data.licoes.length)}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-fit"
          >
            <RefreshCw
              size={16}
              className={isFetching ? "animate-spin" : undefined}
              aria-hidden="true"
            />
            Atualizar
          </Button>
        </div>
        {temMatriz && <LegendaEstados />}
      </div>

      {isLoading ? (
        <div className="space-y-3 p-5" aria-label="Carregando o progresso das lições">
          <Skeleton className="h-8 w-full rounded" />
          <Skeleton className="h-8 w-full rounded" />
          <Skeleton className="h-8 w-full rounded" />
        </div>
      ) : isError || !data ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <AlertCircle className="mb-3 text-destructive" size={32} aria-hidden="true" />
          <h3 className="font-semibold text-foreground">
            Não foi possível carregar o progresso das lições
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">Verifique a conexão e tente de novo.</p>
          <Button className="mt-5" variant="outline" onClick={() => refetch()}>
            <RefreshCw size={16} aria-hidden="true" />
            Tentar de novo
          </Button>
        </div>
      ) : data.licoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-3 rounded-full bg-primary/10 p-4">
            <BookOpen className="text-primary" size={28} aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">
            Nenhuma lição publicada para esta turma. Crie e vincule em{" "}
            <Link
              href="/professor/licoes"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Lições
            </Link>
            .
          </p>
        </div>
      ) : data.alunos.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-3 rounded-full bg-primary/10 p-4">
            <Users className="text-primary" size={28} aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">
            Nenhum aluno matriculado nesta turma. O progresso aparece aqui quando houver alunos.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            {matriz && <MatrizProgressoLicoes matriz={matriz} />}
          </div>
          <div className="md:hidden">
            <ListaProgressoMovel cartoes={cartoes} />
          </div>
        </>
      )}
    </section>
  );
}
