import * as Blockly from 'blockly/core'
import { javascriptGenerator } from 'blockly/javascript'
import { estiloBlocosRobo } from '@/lib/temaBlocklyScratch'
import type { TipoBlocoRobo } from '@/types'

/**
 * Blocos do modo Jogo do Robô. A execução é feita pelo simulador (lib/simuladorRobo.ts), que lê o
 * JSON do workspace; os geradores JS abaixo existem só para o change listener do BlocklyEditor
 * (workspaceToCode) não falhar quando esses blocos estão no workspace.
 */

const definicoes = [
  {
    type: 'robo_mover',
    message0: 'mover %1 %2 casa(s)',
    args0: [
      {
        type: 'field_dropdown',
        name: 'DIRECAO',
        options: [
          ['↑ cima', 'CIMA'],
          ['↓ baixo', 'BAIXO'],
          ['← esquerda', 'ESQUERDA'],
          ['→ direita', 'DIREITA'],
        ],
      },
      { type: 'field_number', name: 'CASAS', value: 1, min: 1, max: 9, precision: 1 },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'robo_blocks',
    tooltip: 'Move o robô na direção escolhida, uma casa de cada vez.',
  },
  {
    type: 'robo_repetir',
    message0: 'repetir %1 vezes',
    args0: [{ type: 'field_number', name: 'VEZES', value: 2, min: 1, max: 10, precision: 1 }],
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'FAZER' }],
    previousStatement: null,
    nextStatement: null,
    style: 'robo_blocks',
    tooltip: 'Repete os blocos de dentro o número de vezes escolhido.',
  },
]

/** Registra os blocos do robô uma única vez (seguro chamar a cada montagem do editor). */
export function registrarBlocosRobo() {
  if (Blockly.Blocks['robo_mover']) return

  Blockly.defineBlocksWithJsonArray(definicoes)
  Blockly.Themes.Classic.setBlockStyle('robo_blocks', { ...estiloBlocosRobo, hat: '' })

  javascriptGenerator.forBlock['robo_mover'] = () => ''
  javascriptGenerator.forBlock['robo_repetir'] = () => ''
}

/** Toolbox sem categorias com os blocos permitidos pelo cenário. */
export function toolboxRobo(blocosPermitidos: TipoBlocoRobo[]): Blockly.utils.toolbox.ToolboxInfo {
  const tipos: TipoBlocoRobo[] = ['robo_mover', 'robo_repetir']
  return {
    kind: 'flyoutToolbox',
    contents: tipos
      .filter((tipo) => blocosPermitidos.includes(tipo))
      .map((tipo) => ({ kind: 'block', type: tipo })),
  }
}
