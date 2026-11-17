"use client";

import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { useGerarAtividadeIa } from "@/hooks/useGerarAtividadeIa";
import { useGerarAtividadeRoboIa } from "@/hooks/useGerarAtividadeRoboIa";
import { useTurmas } from "@/hooks/useTurmas";
import type {
  DificuldadeCenario,
  GerarAtividadeIaRequest,
  GerarAtividadeRoboResposta,
  ParametrosCenarioIa,
} from "@/services/ia";
import type { CenarioRobo, TipoAtividade } from "@/types";
import {
  MAX_OBJETIVO_ROBO,
  PARAMETROS_CENARIO_PADRAO,
  montarPedidoRobo,
} from "@/lib/assistenteRoboIa";
import { GRADE_MAX, GRADE_MIN } from "@/lib/editorCenario";
import { HtmlContent } from "@/components/HtmlContent";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Sugestão do assistente: blocos livres (com gabarito) ou Jogo do Robô (com cenário opcional). */
export type SugestaoAtividadeIa = GerarAtividadeIaRequest & Pick<GerarAtividadeRoboResposta, "cenario">;

const DIFICULDADES: { valor: DificuldadeCenario; nome: string }[] = [
  { valor: "FACIL", nome: "Fácil" },
  { valor: "MEDIO", nome: "Médio" },
  { valor: "DIFICIL", nome: "Difícil" },
];

const TAMANHOS_GRADE = Array.from({ length: GRADE_MAX - GRADE_MIN + 1 }, (_, i) => GRADE_MIN + i);

interface Props {
  open: boolean;
  tipoAtividade: TipoAtividade;
  tipoAtividadeLabel: string;
  /** Modo Jogo do Robô: usa a rota /atividade/gerar-robo. */
  modoJogo?: boolean;
  /** Cenário resolvido no formulário (modo robô); null quando nenhum foi escolhido. */
  cenarioAtual?: CenarioRobo | null;
  /** Título ou descrição já preenchidos: avisa que aceitar substitui o texto. */
  camposPreenchidos?: boolean;
  onAccept: (sugestao: SugestaoAtividadeIa, turmaId: number) => void;
  onClose: () => void;
}

export function GerarAtividadeIaPanel({
  open,
  tipoAtividade,
  tipoAtividadeLabel,
  modoJogo = false,
  cenarioAtual = null,
  camposPreenchidos = false,
  onAccept,
  onClose,
}: Props) {
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState<number | null>(null);
  const [descricaoObjetivo, setDescricaoObjetivo] = useState("");
  const [sugestao, setSugestao] = useState<SugestaoAtividadeIa | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sugerirCenario, setSugerirCenario] = useState(false);
  const [parametros, setParametros] = useState<ParametrosCenarioIa>(PARAMETROS_CENARIO_PADRAO);
  const gerarAtividade = useGerarAtividadeIa();
  const gerarAtividadeRobo = useGerarAtividadeRoboIa();
  const { data: turmas = [] } = useTurmas();

  if (!open) return null;

  const carregando = gerarAtividade.isPending || gerarAtividadeRobo.isPending;
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

    let pedidoRobo = null;
    if (modoJogo) {
      const montado = montarPedidoRobo({
        idTurma: turmaSelecionadaId,
        descricaoObjetivo,
        cenario: cenarioAtual,
        sugerirCenario,
        parametros,
      });
      if ("erro" in montado) {
        setErro(montado.erro);
        return;
      }
      pedidoRobo = montado.pedido;
    }

    setErro(null);

    try {
      const resultado = pedidoRobo
        ? await gerarAtividadeRobo.mutateAsync(pedidoRobo)
        : await gerarAtividade.mutateAsync({
            idTurma: turmaSelecionadaId,
            tipoAtividade,
            descricaoObjetivo: descricaoObjetivo.trim(),
          });

      setSugestao(resultado);
    } catch (err) {
      const msg = (err as { response?: { data?: { erro?: string } } })?.response?.data?.erro;
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
              placeholder={
                modoJogo
                  ? "Ex: Quero que os alunos pratiquem sequências de movimentos desviando de obstáculos."
                  : "Ex: Quero uma atividade de Scratch para praticar repeticao, eventos e tomada de decisao em um jogo simples."
              }
              maxLength={modoJogo ? MAX_OBJETIVO_ROBO : undefined}
              disabled={carregando}
            />
          </div>

          {modoJogo && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-sm text-muted-foreground">
                {cenarioAtual
                  ? "A IA escreve o título e a descrição para o cenário escolhido no formulário."
                  : "Nenhum cenário escolhido no formulário."}
              </p>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="sugerirCenarioIa">Sugerir também um cenário</Label>
                <Switch
                  id="sugerirCenarioIa"
                  checked={sugerirCenario}
                  onCheckedChange={(v) => {
                    setSugerirCenario(v);
                    setErro(null);
                  }}
                  disabled={carregando}
                />
              </div>
              {sugerirCenario && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {(["linhas", "colunas"] as const).map((campo) => (
                      <div key={campo} className="space-y-1.5">
                        <Label htmlFor={`${campo}Ia`}>{campo === "linhas" ? "Linhas" : "Colunas"}</Label>
                        <Select
                          value={String(parametros[campo])}
                          onValueChange={(v) => setParametros((p) => ({ ...p, [campo]: Number(v) }))}
                        >
                          <SelectTrigger id={`${campo}Ia`} className="w-full" disabled={carregando}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TAMANHOS_GRADE.map((n) => (
                              <SelectItem key={n} value={String(n)}>
                                {n}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dificuldadeIa">Dificuldade</Label>
                    <Select
                      value={parametros.dificuldade}
                      onValueChange={(v) =>
                        setParametros((p) => ({ ...p, dificuldade: v as DificuldadeCenario }))
                      }
                    >
                      <SelectTrigger id="dificuldadeIa" className="w-full" disabled={carregando}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFICULDADES.map((d) => (
                          <SelectItem key={d.valor} value={d.valor}>
                            {d.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="usarRepetirIa">Usar o bloco repetir</Label>
                    <Switch
                      id="usarRepetirIa"
                      checked={parametros.usarRepetir}
                      onCheckedChange={(v) => setParametros((p) => ({ ...p, usarRepetir: v }))}
                      disabled={carregando}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ao aceitar, o cenário sugerido abre no editor para você revisar e salvar.
                  </p>
                </div>
              )}
            </div>
          )}

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
                <HtmlContent
                  html={sugestao.descricao}
                  className="mt-1 text-sm leading-6 text-muted-foreground"
                />
              </div>

              {sugestao.cenario && (
                <p className="text-sm text-muted-foreground">
                  Também veio um cenário sugerido: ele abre no editor ao aceitar.
                </p>
              )}

              {camposPreenchidos && (
                <p className="text-sm text-muted-foreground">
                  Ao aceitar, o título e a descrição atuais serão substituídos.
                </p>
              )}
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
