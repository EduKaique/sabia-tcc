"use client";

import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { useGerarAtividadeIa } from "@/hooks/useGerarAtividadeIa";
import { useTurmas } from "@/hooks/useTurmas";
import type { SugestaoAtividadeIa } from "@/service/ia";
import type { TipoAtividade } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  open: boolean;
  tipoAtividade: TipoAtividade;
  tipoAtividadeLabel: string;
  onAccept: (sugestao: SugestaoAtividadeIa, turmaId: number) => void;
  onClose: () => void;
}

export function GerarAtividadeIaPanel({
  open,
  tipoAtividade,
  tipoAtividadeLabel,
  onAccept,
  onClose,
}: Props) {
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState<number | null>(null);
  const [descricaoObjetivo, setDescricaoObjetivo] = useState("");
  const [sugestao, setSugestao] = useState<SugestaoAtividadeIa | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const gerarAtividade = useGerarAtividadeIa();
  const { data: turmas = [] } = useTurmas();

  if (!open) return null;

  const carregando = gerarAtividade.isPending;
  const turmaSelecionada = turmas.find((t) => t.id === turmaSelecionadaId);

  async function handleGerar() {
    if (!turmaSelecionadaId) {
      setErro("Selecione a turma antes de gerar a atividade.");
      return;
    }

    if (descricaoObjetivo.trim().length === 0) {
      setErro("Descreva o objetivo pedagogico antes de gerar a atividade.");
      return;
    }

    setErro(null);

    try {
      const resultado = await gerarAtividade.mutateAsync({
        idTurma: turmaSelecionadaId,
        tipoAtividade,
        descricaoObjetivo: descricaoObjetivo.trim(),
      });

      setSugestao(resultado);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro;
      setErro(msg ?? "Nao foi possivel gerar a atividade. Tente novamente.");
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Fechar assistente de IA"
        className="absolute inset-0 bg-foreground/20"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles size={16} />
              Assistente de IA
            </div>
            <h2 className="mt-1 text-xl font-bold text-foreground">Gerar atividade</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {turmaSelecionada?.nome ?? "Selecione uma turma"} · {tipoAtividadeLabel}
            </p>
          </div>

          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="turmaIa">
              Turma <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={(value) => {
                setTurmaSelecionadaId(Number(value));
                setErro(null);
              }}
              value={turmaSelecionadaId?.toString()}
            >
              <SelectTrigger id="turmaIa" className="w-full" disabled={carregando}>
                <SelectValue placeholder="Selecione uma turma" />
              </SelectTrigger>
              <SelectContent>
                {turmas.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descricaoObjetivo">Objetivo pedagogico</Label>
            <Textarea
              id="descricaoObjetivo"
              value={descricaoObjetivo}
              onChange={(event) => setDescricaoObjetivo(event.target.value)}
              placeholder="Ex: Quero uma atividade de Scratch para praticar repeticao, eventos e tomada de decisao em um jogo simples."
              disabled={carregando}
            />
          </div>

          {erro && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {erro}
            </div>
          )}

          <Button
            type="button"
            className="w-full"
            disabled={carregando}
            aria-busy={carregando}
            onClick={handleGerar}
          >
            {carregando ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Gerar Atividade com IA
              </>
            )}
          </Button>

          {sugestao && (
            <div className="space-y-4 rounded-lg border border-border bg-card p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Titulo sugerido
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{sugestao.titulo}</h3>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Descricao sugerida
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {sugestao.descricao}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          <Button
            type="button"
            disabled={!sugestao || carregando}
            onClick={() => sugestao && turmaSelecionadaId && onAccept(sugestao, turmaSelecionadaId)}
          >
            Aceitar sugestao
          </Button>
        </div>
      </aside>
    </div>
  );
}
