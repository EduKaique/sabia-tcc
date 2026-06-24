// components/BlocklyEditor.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import { javascriptGenerator, Order } from 'blockly/javascript';
import * as ptBr from 'blockly/msg/pt-br';

//@ts-expect-error ignorando tipagem do locale
Blockly.setLocale(ptBr);

// Define o bloco customizado de "Entrada do Usuário" apenas uma vez
if (!Blockly.Blocks['get_input']) {
  Blockly.Blocks['get_input'] = {
    init: function () {
      this.appendDummyInput().appendField('Entrada do Usuário');
      this.setOutput(true, null); // Pode ser string, número, etc.
      this.setColour(160);
      this.setTooltip('Retorna o valor digitado no campo de input acima do editor.');
    },
  };

  // Define como o bloco customizado é convertido para JavaScript
  javascriptGenerator.forBlock['get_input'] = function () {
    // Usaremos a variável 'entrada_usuario' no escopo de execução
    return ['entrada_usuario', Order.ATOMIC];
  };
}

interface BlocklyEditorProps {
  onCodeChange?: (code: string) => void;
}

const BlocklyEditor: React.FC<BlocklyEditorProps> = ({ onCodeChange }) => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  
  const [generatedCode, setGeneratedCode] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [outputValue, setOutputValue] = useState('');

  useEffect(() => {
    if (!workspaceRef.current && blocklyDiv.current) {
      workspaceRef.current = Blockly.inject(blocklyDiv.current, {
        toolbox: `
          <xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">
            <category name="Entrada/Saída" colour="#a55b80">
              <block type="get_input"></block>
              <block type="text_print"></block>
            </category>
            
            <category name="Lógica" colour="%{BKY_LOGIC_HUE}">
              <block type="controls_if"></block>
              <block type="logic_compare"></block>
              <block type="logic_operation"></block>
              <block type="logic_negate"></block>
              <block type="logic_boolean"></block>
              <block type="logic_null"></block>
              <block type="logic_ternary"></block>
            </category>
            
            <category name="Laços (Loops)" colour="%{BKY_LOOPS_HUE}">
              <block type="controls_repeat_ext">
                <value name="TIMES"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
              </block>
              <block type="controls_whileUntil"></block>
              <block type="controls_for">
                <value name="FROM"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
                <value name="TO"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
                <value name="BY"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
              </block>
              <block type="controls_forEach"></block>
              <block type="controls_flow_statements"></block>
            </category>

            <category name="Matemática" colour="%{BKY_MATH_HUE}">
              <block type="math_number"></block>
              <block type="math_arithmetic">
                <value name="A"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
                <value name="B"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
              </block>
              <block type="math_single">
                <value name="NUM"><shadow type="math_number"><field name="NUM">9</field></shadow></value>
              </block>
              <block type="math_trig">
                <value name="NUM"><shadow type="math_number"><field name="NUM">45</field></shadow></value>
              </block>
              <block type="math_constant"></block>
              <block type="math_number_property">
                <value name="NUMBER_TO_CHECK"><shadow type="math_number"><field name="NUM">0</field></shadow></value>
              </block>
              <block type="math_round">
                <value name="NUM"><shadow type="math_number"><field name="NUM">3.1</field></shadow></value>
              </block>
              <block type="math_on_list"></block>
              <block type="math_modulo">
                <value name="DIVIDEND"><shadow type="math_number"><field name="NUM">64</field></shadow></value>
                <value name="DIVISOR"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
              </block>
              <block type="math_constrain">
                <value name="VALUE"><shadow type="math_number"><field name="NUM">50</field></shadow></value>
                <value name="LOW"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
                <value name="HIGH"><shadow type="math_number"><field name="NUM">100</field></shadow></value>
              </block>
            </category>

            <category name="Texto" colour="%{BKY_TEXTS_HUE}">
              <block type="text"></block>
              <block type="text_join"></block>
              <block type="text_append">
                <value name="TEXT"><shadow type="text"></shadow></value>
              </block>
              <block type="text_length">
                <value name="VALUE"><shadow type="text"><field name="TEXT">abc</field></shadow></value>
              </block>
              <block type="text_isEmpty">
                <value name="VALUE"><shadow type="text"><field name="TEXT"></field></shadow></value>
              </block>
              <block type="text_indexOf">
                <value name="VALUE"><block type="variables_get"><field name="VAR">texto</field></block></value>
                <value name="FIND"><shadow type="text"><field name="TEXT">abc</field></shadow></value>
              </block>
              <block type="text_charAt">
                <value name="VALUE"><block type="variables_get"><field name="VAR">texto</field></block></value>
              </block>
              <block type="text_getSubstring">
                <value name="STRING"><block type="variables_get"><field name="VAR">texto</field></block></value>
              </block>
              <block type="text_changeCase">
                <value name="TEXT"><shadow type="text"><field name="TEXT">abc</field></shadow></value>
              </block>
              <block type="text_trim">
                <value name="TEXT"><shadow type="text"><field name="TEXT">abc</field></shadow></value>
              </block>
            </category>

            <category name="Listas (Arrays)" colour="%{BKY_LISTS_HUE}">
              <block type="lists_create_with">
                <mutation items="0"></mutation>
              </block>
              <block type="lists_create_with"></block>
              <block type="lists_repeat">
                <value name="NUM"><shadow type="math_number"><field name="NUM">5</field></shadow></value>
              </block>
              <block type="lists_length"></block>
              <block type="lists_isEmpty"></block>
              <block type="lists_indexOf">
                <value name="VALUE"><block type="variables_get"><field name="VAR">lista</field></block></value>
              </block>
              <block type="lists_getIndex">
                <value name="VALUE"><block type="variables_get"><field name="VAR">lista</field></block></value>
              </block>
              <block type="lists_setIndex">
                <value name="LIST"><block type="variables_get"><field name="VAR">lista</field></block></value>
              </block>
              <block type="lists_getSublist">
                <value name="LIST"><block type="variables_get"><field name="VAR">lista</field></block></value>
              </block>
              <block type="lists_split">
                <value name="DELIM"><shadow type="text"><field name="TEXT">,</field></shadow></value>
              </block>
              <block type="lists_sort"></block>
            </category>

            <sep></sep>
            
            <category name="Variáveis" colour="%{BKY_VARIABLES_HUE}" custom="VARIABLE"></category>
            <category name="Funções" colour="%{BKY_PROCEDURES_HUE}" custom="PROCEDURE"></category>
          </xml>
        `,
        trashcan: true,
      });

      workspaceRef.current.addChangeListener(() => {
        if (workspaceRef.current) {
          const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
          setGeneratedCode(code);
          if (onCodeChange) onCodeChange(code);
        }
      });
    }

    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  }, [onCodeChange]);

  // Função para executar o código do Blockly
  const handleRunCode = () => {
    const outputBuffer: string[] = [];
    
    const originalAlert = window.alert;
    window.alert = (msg: string) => {
      outputBuffer.push(String(msg));
    };

    try {
      const executableFunc = new Function('entrada_usuario', generatedCode);
      // Avaliamos o inputValue (caso o usuário tenha digitado um JSON, array, ou número direto no input)
      let parsedInput = inputValue;
      try {
          parsedInput = JSON.parse(inputValue);
      } catch(e) {
          // Se não for um JSON/Número válido, passa como string normal
      }

      executableFunc(parsedInput);
      
      setOutputValue(
        outputBuffer.length > 0 
          ? outputBuffer.join(' ') 
          : 'Executado com sucesso. (Nenhuma saída impressa)'
      );
    } catch (error) {
      setOutputValue(`Erro na execução`);
    } finally {
      window.alert = originalAlert;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* 1. ÁREA DE INPUT SUPERIOR */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <label htmlFor="blockly-input" style={{ fontWeight: 'bold' }}>Input de Dados:</label>
        <input
          id="blockly-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ex: [1, 2, 3] ou 'texto'"
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button 
          onClick={handleRunCode}
          type="button"
          style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Executar Código
        </button>
      </div>

      {/* 2. EDITOR BLOCKLY CENTRALIZADO */}
      <div ref={blocklyDiv} style={{ height: '600px', width: '100%', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }} />

      {/* 3. ÁREA DE OUTPUT INFERIOR */}
      <div style={{ padding: '10px', backgroundColor: '#282c34', color: '#61dafb', borderRadius: '8px', minHeight: '100px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>Output da Execução:</h4>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'monospace' }}>
          {outputValue || 'Aguardando execução...'}
        </pre>
      </div>

    </div>
  );
};

export default BlocklyEditor;