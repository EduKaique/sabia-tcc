"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  getCode: () => string;
}

export function PainelEntradaSaida({ getCode }: Props) {
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
