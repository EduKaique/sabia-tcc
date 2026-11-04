"use client";

import Link from "next/link";
import { Clock, GraduationCap, KeyRound, ArrowRight } from "lucide-react";
import type { Turma } from "@/types";
import { etapaEnsinoLabels, turnoLabels } from "@/lib/schemas/turmaSchema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Ano/série, turno e código de convite da turma (card e página da turma). */
export function TurmaMeta({ turma }: { turma: Turma }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
      {turma.anoSerie && (
        <span className="flex items-center gap-1">
          <GraduationCap size={14} />
          {turma.anoSerie}
        </span>
      )}
      {turma.turno && (
        <span className="flex items-center gap-1">
          <Clock size={14} />
          {turnoLabels[turma.turno]}
        </span>
      )}
      {turma.codigoConvite && (
        <span className="flex items-center gap-1 font-mono">
          <KeyRound size={14} />
          {turma.codigoConvite}
        </span>
      )}
    </div>
  );
}

interface Props {
  turma: Turma;
}

export function TurmaCard({ turma }: Props) {
  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <h3 className="text-xl font-bold text-foreground truncate">{turma.nome}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{etapaEnsinoLabels[turma.etapa]}</p>

        <div className="mt-4">
          <TurmaMeta turma={turma} />
        </div>

        <div className="flex justify-end mt-4">
          <Button size="sm" asChild>
            <Link href={`/professor/turmas/${turma.id}`}>
              Acessar turma
              <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
