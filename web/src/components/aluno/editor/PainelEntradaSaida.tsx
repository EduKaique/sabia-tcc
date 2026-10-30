"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { fredoka } from "@/lib/fontesHome";
import { botaoPrincipal, campo, rotulo } from "@/lib/estilos";

interface Props {
  getCode: () => string;
  /** Aparência opt-in do editor do aluno; o padrão é o visual usado na correção do professor. */
  tema?: "padrao" | "scratch";
}

export function PainelEntradaSaida({ getCode, tema = "padrao" }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [outputValue, setOutputValue] = useState("");

  const runCode = () => {
    const code = getCode();
    if (!code.trim()) {
      setOutputValue("Nenhum bloco para executar.");
      return;
    }

    const outputBuffer: string[] = [];
    const originalAlert = window.alert;
    window.alert = (msg: string) => outputBuffer.push(String(msg));

    try {
      let parsedInput: unknown = inputValue;
      try {
        parsedInput = JSON.parse(inputValue);
      } catch {}

      new Function("entrada_usuario", code)(parsedInput);

      setOutputValue(
        outputBuffer.length > 0
          ? outputBuffer.join("\n")
          : "Executado com sucesso. (Nenhuma saída impressa)"
      );
    } catch (err) {
      setOutputValue(`Erro: ${err}`);
    } finally {
      window.alert = originalAlert;
    }
  };

  if (tema === "scratch") {
    return (
      <aside className="w-80 h-full flex flex-col border-l-2 border-tinta/15 bg-white shrink-0">
        <div className="p-4 border-b-2 border-tinta/10">
          <button
            type="button"
            onClick={runCode}
            className={cn(
              botaoPrincipal,
              fredoka.className,
              "w-full min-h-12 py-2 text-base bg-sabia-verde hover:bg-[#6fc983]"
            )}
          >
            <Play size={16} className="fill-current" aria-hidden="true" />
            Rodar Código
          </button>
        </div>

        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
          <div className="space-y-2">
            <label htmlFor="painel-entrada" className={cn(rotulo, "block")}>
              Entrada
            </label>
            <textarea
              id="painel-entrada"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ex: [1, 2, 3] ou 'texto'"
              className={cn(campo, "h-24 font-mono text-sm resize-none")}
            />
          </div>

          <div className="flex-1 space-y-2">
            <p className={rotulo}>Saída</p>
            <pre
              aria-live="polite"
              className="w-full h-1/2 min-h-24 p-3 text-sm font-mono bg-tinta text-[#9be7ae] rounded-2xl overflow-auto whitespace-pre-wrap wrap-break-words"
            >
              {outputValue || "Aguardando execução..."}
            </pre>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 h-full flex flex-col border-l border-border bg-white shrink-0">
      <div className="p-3 border-b border-border">
        <Button onClick={runCode} size="sm" variant="outline" className="w-full gap-1.5">
          <Play size={14} />
          Rodar Código
        </Button>
      </div>

      <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Input
          </p>
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ex: [1, 2, 3] ou 'texto'"
            className="h-24 text-sm font-mono resize-none"
          />
        </div>

        <div className="flex-1 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Output
          </p>
          <pre className="w-full h-1/2 min-h-24 p-2 text-sm font-mono bg-zinc-900 text-emerald-400 rounded-md overflow-auto whitespace-pre-wrap wrap-break-words">
            {outputValue || "Aguardando execução..."}
          </pre>
        </div>
      </div>
    </aside>
  );
}
