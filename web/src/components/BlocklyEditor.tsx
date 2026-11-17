// components/BlocklyEditor.tsx
import React, { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly/core";
import "blockly/blocks";
import { javascriptGenerator, Order } from "blockly/javascript";
import * as ptBr from "blockly/msg/pt-br";
import { atributosCategoriaScratch, opcoesScratch, type CategoriaToolbox } from "@/lib/temaBlocklyScratch";
import { toolboxBlocosLivres } from "@/lib/toolboxBlocosLivres";
import { registrarBlocosRobo } from "@/lib/blocosRobo";

//@ts-expect-error ignorando tipagem do locale
Blockly.setLocale(ptBr);

if (!Blockly.Blocks["get_input"]) {
  Blockly.Blocks["get_input"] = {
    init: function () {
      this.appendDummyInput().appendField("Entrada do Usuário");
      this.setOutput(true, null);
      this.setColour(160);
      this.setTooltip("Retorna o valor digitado no campo de input acima do editor.");
    },
  };

  javascriptGenerator.forBlock["get_input"] = function () {
    return ["entrada_usuario", Order.ATOMIC];
  };
}

const CORES_PADRAO: Record<CategoriaToolbox, string> = {
  entrada_saida: "#a55b80",
  logica: "%{BKY_LOGIC_HUE}",
  lacos: "%{BKY_LOOPS_HUE}",
  matematica: "%{BKY_MATH_HUE}",
  texto: "%{BKY_TEXTS_HUE}",
  listas: "%{BKY_LISTS_HUE}",
  variaveis: "%{BKY_VARIABLES_HUE}",
  funcoes: "%{BKY_PROCEDURES_HUE}",
};

interface BlocklyEditorProps {
  onCodeChange?: (code: string) => void;
  onStateChange?: (state: string) => void;
  initialState?: string;
  workspaceOnly?: boolean;
  readOnly?: boolean;
  onVariablePrompt?: (message: string, defaultValue: string, callback: (value: string | null) => void) => void;
  /** Aparência opt-in: "scratch" (editor do aluno). Lida só na criação do workspace. */
  tema?: "padrao" | "scratch";
  /** Recebe o workspace depois do inject (ex.: para fechar o flyout antes de abrir um modal). */
  workspaceExternoRef?: React.MutableRefObject<Blockly.WorkspaceSvg | null>;
  /** Substitui a toolbox padrão (ex.: toolboxRobo). Lida só na criação do workspace. */
  toolbox?: Blockly.utils.toolbox.ToolboxDefinition;
  /** Opções do inject mescladas por último (ex.: maxBlocks). Lidas só na criação do workspace. */
  opcoesExtras?: Blockly.BlocklyOptions;
}

const BlocklyEditor: React.FC<BlocklyEditorProps> = ({ onCodeChange, onStateChange, initialState, workspaceOnly, readOnly, onVariablePrompt, tema = "padrao", workspaceExternoRef, toolbox, opcoesExtras }) => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const onCodeChangeRef = useRef(onCodeChange);
  const onStateChangeRef = useRef(onStateChange);
  const onVariablePromptRef = useRef(onVariablePrompt);
  const readOnlyRef = useRef(readOnly);
  const temaRef = useRef(tema);
  const workspaceExternoRefRef = useRef(workspaceExternoRef);
  const toolboxRef = useRef(toolbox);
  const opcoesExtrasRef = useRef(opcoesExtras);

  const [generatedCode, setGeneratedCode] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [outputValue, setOutputValue] = useState("");

  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
  }, [onCodeChange]);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    onVariablePromptRef.current = onVariablePrompt;
  }, [onVariablePrompt]);

  useEffect(() => {
    const workspaceExterno = workspaceExternoRefRef.current;
    // Registrados sempre (fora da toolbox padrão) para o modo somente leitura carregar estados do robô.
    registrarBlocosRobo();
    if (!workspaceRef.current && blocklyDiv.current) {
      const opcoesComuns = {
        zoom: { controls: true, wheel: false, startScale: 1.25 },
        grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
        move: {wheel: true},
        ...(temaRef.current === "scratch" ? opcoesScratch : {}),
        ...opcoesExtrasRef.current,
      };
      const cor = (categoria: CategoriaToolbox) =>
        temaRef.current === "scratch"
          ? atributosCategoriaScratch(categoria)
          : `colour="${CORES_PADRAO[categoria]}"`;

      workspaceRef.current = Blockly.inject(blocklyDiv.current, readOnlyRef.current ? { ...opcoesComuns, readOnly: true } : {
        toolbox: toolboxRef.current ?? toolboxBlocosLivres(cor),
        trashcan: true,
        ...opcoesComuns
      });

      Blockly.dialog.setPrompt((message, defaultValue, callback) => {
        if (onVariablePromptRef.current) {
          workspaceRef.current?.getFlyout()?.hide();
          onVariablePromptRef.current(message, defaultValue, callback);
        } else {
          callback(window.prompt(message, defaultValue));
        }
      });

      if (workspaceExterno) workspaceExterno.current = workspaceRef.current;

      workspaceRef.current.addChangeListener(() => {
        if (workspaceRef.current) {
          const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
          setGeneratedCode(code);
          onCodeChangeRef.current?.(code);
          if (onStateChangeRef.current) {
            const state = Blockly.serialization.workspaces.save(workspaceRef.current);
            onStateChangeRef.current(JSON.stringify(state));
          }
        }
      });
    }

    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
        if (workspaceExterno) workspaceExterno.current = null;
      }
    };
  }, []); 

  useEffect(() => {
    if (!workspaceRef.current || !initialState) return;
    try {
      const parsed = JSON.parse(initialState);
      Blockly.serialization.workspaces.load(parsed, workspaceRef.current);
    } catch (err) {
      console.error("[Blockly] Falha ao carregar estado:", err);
    }
  }, [initialState]);

  const handleRunCode = () => {
    const outputBuffer: string[] = [];

    const originalAlert = window.alert;
    window.alert = (msg: string) => {
      outputBuffer.push(String(msg));
    };

    try {
      const executableFunc = new Function("entrada_usuario", generatedCode);
      let parsedInput: unknown = inputValue;
      try {
        parsedInput = JSON.parse(inputValue);
      } catch {
        // Não é JSON válido — passa como string normal
      }

      executableFunc(parsedInput);

      setOutputValue(
        outputBuffer.length > 0
          ? outputBuffer.join(" ")
          : "Executado com sucesso. (Nenhuma saída impressa)"
      );
    } catch {
      setOutputValue("Erro na execução");
    } finally {
      window.alert = originalAlert;
    }
  };

  if (workspaceOnly) {
    return <div ref={blocklyDiv} className="w-full h-full" />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        width: "100%",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      {/* 1. ÁREA DE INPUT SUPERIOR */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          padding: "10px",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <label htmlFor="blockly-input" style={{ fontWeight: "bold" }}>
          Input de Dados:
        </label>
        <input
          id="blockly-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ex: [1, 2, 3] ou 'texto'"
          style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <button
          onClick={handleRunCode}
          type="button"
          style={{
            padding: "8px 16px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Executar Código
        </button>
      </div>

      {/* 2. EDITOR BLOCKLY */}
      <div
        ref={blocklyDiv}
        style={{
          height: "600px",
          width: "100%",
          border: "1px solid #ccc",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      />

      {/* 3. ÁREA DE OUTPUT */}
      <div
        style={{
          padding: "10px",
          backgroundColor: "#282c34",
          color: "#61dafb",
          borderRadius: "8px",
          minHeight: "100px",
        }}
      >
        <h4 style={{ margin: "0 0 10px 0", color: "#fff" }}>Output da Execução:</h4>
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            fontFamily: "monospace",
          }}
        >
          {outputValue || "Aguardando execução..."}
        </pre>
      </div>
    </div>
  );
};

export default BlocklyEditor;
