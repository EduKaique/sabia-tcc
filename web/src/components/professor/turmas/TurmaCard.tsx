"use client";

import { Pencil, Trash2, Clock, GraduationCap, KeyRound } from "lucide-react";
import type { Turma } from "@/types";
import { etapaEnsinoLabels, turnoLabels } from "@/lib/schemas/turmaSchema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  turma: Turma;
  onEditar: (turma: Turma) => void;
  onExcluir: (turma: Turma) => void;
}

export function TurmaCard({ turma, onEditar, onExcluir }: Props) {
  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <h3 className="text-xl font-bold text-foreground truncate">{turma.nome}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{etapaEnsinoLabels[turma.etapa]}</p>

        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
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

        <div className="flex justify-end gap-1 mt-4">
          <Button variant="ghost" size="sm" onClick={() => onEditar(turma)}>
            <Pencil size={14} />
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onExcluir(turma)}
          >
            <Trash2 size={14} />
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
