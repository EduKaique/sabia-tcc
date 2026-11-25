import { z } from 'zod'

export const NOME_PADRAO_PROJETO = 'Projeto sem título'

/** Nome de um projeto do Sandbox (renomear na galeria e no cabeçalho do editor). */
export const nomeProjetoSandboxSchema = z
  .string()
  .trim()
  .min(1, 'Digite um nome para o projeto.')
  .max(100, 'O nome deve ter no máximo 100 caracteres.')
