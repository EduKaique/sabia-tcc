/** O estado serializado (Blockly.serialization.workspaces.save) tem ao menos um bloco? */
export function hasBlocks(stateJson: string): boolean {
  try {
    const state = JSON.parse(stateJson)
    return Array.isArray(state?.blocks?.blocks) && state.blocks.blocks.length > 0
  } catch {
    return false
  }
}
