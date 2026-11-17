"use client";

import { useState } from "react";
import { Bot, Eraser, Info, Square, Star } from "lucide-react";
import type { CenarioRobo, PosicaoRobo, TipoBlocoRobo } from "@/types";
import type { CenarioSalvoPayload } from "@/types/cenario";
import {
  BLOCOS_ROBO,
  GRADE_MAX,
  GRADE_MIN,
  aplicarFerramenta,
  criarCenarioVazio,
  mesmaPosicao,
  montarCenario,
  redimensionar,
  validarFormaCenario,
  type FerramentaCenario,
} from "@/lib/editorCenario";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface EditorCenarioProps {
  /** Cenário para editar (ex.: um salvo, ou uma sugestão a revisar); sem ele, começa numa grade 5×5 vazia. */
  valorInicial?: { nome: string; cenario: CenarioRobo };
  onSalvar: (dados: CenarioSalvoPayload) => void;
  onCancelar: () => void;
  salvando?: boolean;
  /** Mensagem do servidor (ex.: 400 de cenário sem caminho, 409 de limite). */
  erro?: string | null;
}

const FERRAMENTAS: { id: FerramentaCenario; nome: string; icone: typeof Bot }[] = [
  { id: "inicio", nome: "Início", icone: Bot },
  { id: "destino", nome: "Destino", icone: Star },
  { id: "obstaculo", nome: "Obstáculo", icone: Square },
  { id: "apagar", nome: "Apagar", icone: Eraser },
];

const TAMANHOS = Array.from({ length: GRADE_MAX - GRADE_MIN + 1 }, (_, i) => GRADE_MIN + i);

function conteudoCelula(cenario: CenarioRobo, pos: PosicaoRobo) {
  if (mesmaPosicao(cenario.inicio, pos)) return "inicio" as const;
  if (mesmaPosicao(cenario.destino, pos)) return "destino" as const;
  if (cenario.obstaculos.some((o) => mesmaPosicao(o, pos))) return "obstaculo" as const;
  return "vazia" as const;
}

const ROTULO_CONTEUDO = {
  inicio: "início",
  destino: "destino",
  obstaculo: "obstáculo",
  vazia: "vazia",
} as const;

/** Editor de cenário do Jogo do Robô: tamanho, grade clicável, blocos permitidos e limite de blocos. */
export function EditorCenario({
  valorInicial,
  onSalvar,
  onCancelar,
  salvando = false,
  erro,
}: EditorCenarioProps) {
  const [nome, setNome] = useState(valorInicial?.nome ?? "");
  const [cenario, setCenario] = useState<CenarioRobo>(
    () => valorInicial?.cenario ?? criarCenarioVazio(5, 5)
  );
  const [blocos, setBlocos] = useState<TipoBlocoRobo[]>(
    valorInicial?.cenario.blocosPermitidos ?? BLOCOS_ROBO.map((b) => b.tipo)
  );
  const [maxBlocos, setMaxBlocos] = useState(
    valorInicial?.cenario.maxBlocos ? String(valorInicial.cenario.maxBlocos) : ""
  );
  const [ferramenta, setFerramenta] = useState<FerramentaCenario>("obstaculo");

  const limite = maxBlocos.trim() === "" ? null : Number(maxBlocos);
  const limiteInvalido = limite !== null && (!Number.isInteger(limite) || limite < 1);
  const final = montarCenario(cenario, blocos, limite);
  const erroForma = validarFormaCenario(final);
  const nomeInvalido = nome.trim().length < 3 || nome.trim().length > 100;
  const podeSalvar = !salvando && !nomeInvalido && !erroForma && !limiteInvalido;

  function alternarBloco(tipo: TipoBlocoRobo, marcado: boolean) {
    setBlocos((atual) => (marcado ? [...atual, tipo] : atual.filter((b) => b !== tipo)));
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!podeSalvar) return;
    onSalvar({ nome: nome.trim(), cenarioJson: JSON.stringify(final) });
  }

  return (
    <form onSubmit={salvar} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="nomeCenario">
          Nome <span className="text-destructive">*</span>
        </Label>
        <Input
          id="nomeCenario"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={100}
          placeholder="Ex.: Labirinto em L"
        />
        {nome.length > 0 && nomeInvalido && (
          <p className="text-xs text-destructive">O nome deve ter entre 3 e 100 caracteres.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        {(["linhas", "colunas"] as const).map((eixo) => (
          <div key={eixo} className="space-y-1.5">
            <Label htmlFor={`cenario-${eixo}`}>{eixo === "linhas" ? "Linhas" : "Colunas"}</Label>
            <Select
              value={String(cenario[eixo])}
              onValueChange={(v) =>
                setCenario((c) =>
                  eixo === "linhas"
                    ? redimensionar(c, Number(v), c.colunas)
                    : redimensionar(c, c.linhas, Number(v))
                )
              }
            >
              <SelectTrigger id={`cenario-${eixo}`} className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAMANHOS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground" id="ferramentas-cenario">
          Ferramenta
        </p>
        <div role="group" aria-labelledby="ferramentas-cenario" className="flex flex-wrap gap-2">
          {FERRAMENTAS.map(({ id, nome: rotulo, icone: Icone }) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={ferramenta === id ? "default" : "outline"}
              aria-pressed={ferramenta === id}
              onClick={() => setFerramenta(id)}
            >
              <Icone size={14} />
              {rotulo}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div
          role="grid"
          aria-label="Grade do cenário"
          className="inline-grid gap-0.5 rounded-md border-2 border-tinta p-0.5"
          style={{ gridTemplateColumns: `repeat(${cenario.colunas}, 2.25rem)` }}
        >
          {Array.from({ length: cenario.linhas * cenario.colunas }, (_, i) => {
            const pos = { linha: Math.floor(i / cenario.colunas), coluna: i % cenario.colunas };
            const conteudo = conteudoCelula(cenario, pos);
            return (
              <button
                key={i}
                type="button"
                aria-label={`Linha ${pos.linha + 1}, coluna ${pos.coluna + 1}: ${ROTULO_CONTEUDO[conteudo]}`}
                onClick={() => setCenario((c) => aplicarFerramenta(c, ferramenta, pos))}
                className={cn(
                  "flex size-9 items-center justify-center rounded-sm border border-tinta/15 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
                  (pos.linha + pos.coluna) % 2 === 0 ? "bg-white" : "bg-sabia-azul-claro",
                  conteudo === "obstaculo" && "bg-tinta-apoio"
                )}
              >
                {conteudo === "inicio" && <Bot size={20} className="text-tinta" aria-hidden />}
                {conteudo === "destino" && (
                  <Star size={20} className="fill-sabia-amarelo text-tinta" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <ul className="flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="Legenda">
        <li className="flex items-center gap-1">
          <Bot size={14} className="text-tinta" aria-hidden /> Início do robô
        </li>
        <li className="flex items-center gap-1">
          <Star size={14} className="fill-sabia-amarelo text-tinta" aria-hidden /> Destino
        </li>
        <li className="flex items-center gap-1">
          <span className="inline-block size-3.5 rounded-sm bg-tinta-apoio" aria-hidden /> Obstáculo
        </li>
      </ul>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">
          Blocos permitidos <span className="text-destructive">*</span>
        </legend>
        <div className="flex flex-wrap gap-4">
          {BLOCOS_ROBO.map((b) => (
            <label key={b.tipo} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={blocos.includes(b.tipo)}
                onChange={(e) => alternarBloco(b.tipo, e.target.checked)}
              />
              {b.nome}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="cenarioMaxBlocos">Limite de blocos (opcional)</Label>
        <Input
          id="cenarioMaxBlocos"
          type="number"
          min={1}
          step={1}
          value={maxBlocos}
          onChange={(e) => setMaxBlocos(e.target.value)}
          className="w-40"
        />
        {limiteInvalido && (
          <p className="text-xs text-destructive">Use um número inteiro maior que zero.</p>
        )}
      </div>

      {erroForma && <p className="text-sm text-destructive">{erroForma}</p>}

      <p className="flex items-start gap-2 rounded-md bg-secondary/60 p-3 text-sm text-muted-foreground">
        <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
        Atividades que já usam este cenário não são alteradas.
      </p>

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancelar} disabled={salvando}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!podeSalvar}>
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
