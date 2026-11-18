import type { CategoriaToolbox } from "@/lib/temaBlocklyScratch";

/**
 * Toolbox padrão do modo blocos livres (XML do Blockly). `cor` devolve os atributos de cor de cada
 * categoria conforme o tema. Todo tipo daqui precisa estar classificado em
 * fixtures/blocos-livres/classificacao.json (teste toolboxBlocosLivres.test.ts).
 */
export function toolboxBlocosLivres(cor: (categoria: CategoriaToolbox) => string): string {
  return `
          <xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">
            <category name="Entrada/Saída" ${cor("entrada_saida")}>
              <block type="get_input"></block>
              <block type="text_print"></block>
            </category>
            
            <category name="Lógica" ${cor("logica")}>
              <block type="controls_if"></block>
              <block type="logic_compare"></block>
              <block type="logic_operation"></block>
              <block type="logic_negate"></block>
              <block type="logic_boolean"></block>
              <block type="logic_null"></block>
              <block type="logic_ternary"></block>
            </category>
            
            <category name="Laços (Loops)" ${cor("lacos")}>
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

            <category name="Matemática" ${cor("matematica")}>
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

            <category name="Texto" ${cor("texto")}>
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

            <category name="Listas (Arrays)" ${cor("listas")}>
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
            
            <category name="Variáveis" ${cor("variaveis")} custom="VARIABLE"></category>
            <category name="Funções" ${cor("funcoes")} custom="PROCEDURE"></category>
          </xml>
        `;
}

/** Tipos que as categorias dinâmicas (custom="VARIABLE" e custom="PROCEDURE") adicionam ao toolbox. */
export const TIPOS_DINAMICOS_BLOCOS_LIVRES = [
  "variables_set",
  "math_change",
  "variables_get",
  "procedures_defnoreturn",
  "procedures_defreturn",
  "procedures_ifreturn",
  "procedures_callnoreturn",
  "procedures_callreturn",
] as const;
