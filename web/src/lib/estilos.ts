/**
 * Classes da home e do módulo do aluno, nos tokens da paleta (globals.css): tinta, sabia-amarelo,
 * sabia-azul... Contraste AA sobre branco: tinta 15:1, tinta-apoio 9:1, sabia-erro 6.5:1.
 */

const foco =
  'outline-none focus-visible:ring-4 focus-visible:ring-sabia-azul focus-visible:ring-offset-2 focus-visible:ring-offset-white'

/** Botão amarelo "3D" (mesmo visual do antigo "Bora começar!"). */
export const botaoPrincipal = [
  'inline-flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-tinta bg-sabia-amarelo px-7 py-3 text-lg font-bold text-tinta',
  'shadow-[0_5px_0_var(--color-tinta)] transition-[transform,box-shadow,background-color] duration-150',
  'hover:-translate-y-0.5 hover:bg-sabia-amarelo-hover hover:shadow-[0_7px_0_var(--color-tinta)]',
  'active:translate-y-1 active:shadow-[0_1px_0_var(--color-tinta)]',
  'disabled:cursor-wait disabled:translate-y-0 disabled:bg-[#fbd56b] disabled:shadow-[0_5px_0_var(--color-tinta)]',
  foco,
].join(' ')

/** Botão de contorno (ações secundárias: Voltar, Já tenho conta). */
export const botaoSecundario = [
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-tinta bg-white px-6 py-2.5 text-base font-bold text-tinta',
  'transition-colors duration-150 hover:bg-sabia-azul-claro',
  foco,
].join(' ')

/** Link discreto com área de toque de 48px. */
export const linkDiscreto = [
  'inline-flex min-h-12 items-center justify-center rounded-full px-3 text-base font-bold text-sabia-azul-escuro underline underline-offset-4 hover:text-tinta',
  foco,
].join(' ')

/** Cartão branco com borda tinta e sombra sólida, no idioma dos blocos. */
export const cartao = 'rounded-[1.5rem] border-2 border-tinta bg-white shadow-[0_4px_0_var(--color-tinta)]'

export const rotulo = 'text-base font-bold text-tinta'

export const textoApoio = 'text-sm font-medium text-tinta-apoio'

export const textoErro = 'text-sm font-bold text-sabia-erro'

export const campo = [
  'block min-h-12 w-full rounded-2xl border-2 border-tinta/35 bg-white px-4 py-2.5 text-base font-semibold text-tinta',
  'placeholder:font-medium placeholder:text-[#6b7290]',
  'transition-colors focus:border-sabia-azul focus:outline-none focus:ring-4 focus:ring-sabia-azul/25',
  'aria-[invalid=true]:border-sabia-erro aria-[invalid=true]:focus:ring-sabia-erro/20',
].join(' ')

/** Caixa de alerta (erro geral). A região existe no DOM antes da mensagem aparecer. */
export const alertaErro =
  'rounded-2xl border-2 border-sabia-erro/40 bg-sabia-erro-claro px-4 py-3 text-left text-sm font-bold text-sabia-erro-escuro'
