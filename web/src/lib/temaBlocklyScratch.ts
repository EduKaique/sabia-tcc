import * as Blockly from 'blockly/core'

/**
 * Tema opt-in do BlocklyEditor (tema="scratch"), usado no editor do aluno: renderer zelos e a
 * paleta do Scratch 3. Os estilos de toolbox/flyout ficam em globals.css, no escopo
 * `.sabia-scratch-theme` (classe que o Blockly põe no injectionDiv a partir do nome do tema).
 */

/** Categorias que existem na toolbox do BlocklyEditor. */
export type CategoriaToolbox =
  | 'entrada_saida'
  | 'logica'
  | 'lacos'
  | 'matematica'
  | 'texto'
  | 'listas'
  | 'variaveis'
  | 'funcoes'

/** Cores do Scratch 3: primária, secundária e terciária (borda). */
const paleta = {
  sensores: { colourPrimary: '#5CB1D6', colourSecondary: '#47A8D1', colourTertiary: '#2E8EB8' },
  eventos: { colourPrimary: '#FFBF00', colourSecondary: '#E6AC00', colourTertiary: '#CC9900' },
  controle: { colourPrimary: '#FFAB19', colourSecondary: '#EC9C13', colourTertiary: '#CF8B17' },
  operadores: { colourPrimary: '#59C059', colourSecondary: '#46B946', colourTertiary: '#389438' },
  aparencia: { colourPrimary: '#9966FF', colourSecondary: '#855CD6', colourTertiary: '#774DCB' },
  listas: { colourPrimary: '#FF661A', colourSecondary: '#FF5500', colourTertiary: '#E64D00' },
  variaveis: { colourPrimary: '#FF8C1A', colourSecondary: '#FF8000', colourTertiary: '#DB6E00' },
  meusBlocos: { colourPrimary: '#FF6680', colourSecondary: '#FF4D6A', colourTertiary: '#FF3355' },
  robo: { colourPrimary: '#0F8B8D', colourSecondary: '#0C7A7C', colourTertiary: '#096668' },
}

/** Estilo dos blocos do robô; também registrado no tema padrão por `registrarBlocosRobo`. */
export const estiloBlocosRobo = paleta.robo

const corCategoria: Record<CategoriaToolbox, keyof typeof paleta> = {
  entrada_saida: 'sensores',
  logica: 'eventos',
  lacos: 'controle',
  matematica: 'operadores',
  texto: 'aparencia',
  listas: 'listas',
  variaveis: 'variaveis',
  funcoes: 'meusBlocos',
}

export const temaScratch = Blockly.Theme.defineTheme('sabia-scratch', {
  name: 'sabia-scratch',
  base: Blockly.Themes.Classic,
  blockStyles: {
    logic_blocks: paleta.eventos,
    loop_blocks: paleta.controle,
    math_blocks: paleta.operadores,
    text_blocks: paleta.aparencia,
    list_blocks: paleta.listas,
    variable_blocks: paleta.variaveis,
    variable_dynamic_blocks: paleta.variaveis,
    procedure_blocks: paleta.meusBlocos,
    robo_blocks: paleta.robo,
  },
  categoryStyles: Object.fromEntries(
    Object.entries(corCategoria).map(([categoria, cor]) => [
      `${categoria}_categoria`,
      { colour: paleta[cor].colourPrimary },
    ]),
  ),
  componentStyles: {
    workspaceBackgroundColour: '#F9F9F9',
    toolboxBackgroundColour: '#FFFFFF',
    toolboxForegroundColour: '#575E75',
    flyoutBackgroundColour: '#FFFFFF',
    flyoutForegroundColour: '#575E75',
    flyoutOpacity: 1,
    scrollbarColour: '#CECDCE',
    scrollbarOpacity: 0.8,
    insertionMarkerColour: '#000000',
    insertionMarkerOpacity: 0.2,
    selectedGlowColour: '#FFF200',
    selectedGlowOpacity: 0.6,
  },
  fontStyle: {
    family: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    weight: 'bold',
    size: 12,
  },
})

/** Opções do inject que só valem no tema scratch (mescladas sobre as opções comuns). */
export const opcoesScratch = {
  renderer: 'zelos',
  theme: temaScratch,
  zoom: { controls: true, wheel: false, startScale: 0.9 },
  grid: { spacing: 40, length: 2, colour: '#DDDDDD', snap: true },
}

/** Atributos de uma <category> no tema scratch: estilo do tema + marcador redondo colorido. */
export function atributosCategoriaScratch(categoria: CategoriaToolbox) {
  return `categorystyle="${categoria}_categoria" css-icon="sabiaCatIcone sabiaCat-${corCategoria[categoria]}"`
}
