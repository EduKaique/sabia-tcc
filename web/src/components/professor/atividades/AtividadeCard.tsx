"use client";

import Link from "next/link";
import {Calendar, Trophy, ArrowRight } from "lucide-react";
import type { AtividadeAvaliativa } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  atividade: AtividadeAvaliativa;
  turmaNome?: string;
}

export function AtividadeCard({
  atividade,
  turmaNome,
}: Props) {
  const isPublicada = atividade.status === "PUBLICADA";

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              {isPublicada ? (
                <span className="inline-flex items-center bg-[#ECFDF5] text-[#065F46] rounded-full px-2 py-0.5 text-xs font-medium">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1" />
                  Publicada
                </span>
              ) : (
                <span className="inline-flex items-center bg-[#FFFBEB] text-[#92400E] rounded-full px-2 py-0.5 text-xs font-medium">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F59E0B] mr-1" />
                  Rascunho
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-foreground truncate">{atividade.titulo}</h3>
            {turmaNome && <p className="text-sm text-muted-foreground mt-0.5">{turmaNome}</p>}
          </div>
        </div>

        <div className="flex justify-between">
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Trophy size={14} className="w-3.5 h-3.5" />
              {atividade.pontuacaoMaxima} pts
            </span>
            {atividade.dataEntrega && (
              <span className="flex items-center gap-1">
                <Calendar size={14} className="w-3.5 h-3.5" />
                {formatDate(atividade.dataEntrega)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link href={`/professor/atividades/${atividade.id}`}>
              <Button variant="ghost" className="text-primary">
                Ver atividade <ArrowRight />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
