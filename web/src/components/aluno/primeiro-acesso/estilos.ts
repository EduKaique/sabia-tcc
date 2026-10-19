/**
 * Classes da entrada do aluno, na paleta da home (tinta #1e2546, amarelo #f9bd15, azul #426cda).
 * Contraste AA sobre branco: tinta 15:1, apoio #3a4266 9:1, erro #b3261e 6.5:1.
 */

const foco =
  'outline-none focus-visible:ring-4 focus-visible:ring-[#426cda] focus-visible:ring-offset-2 focus-visible:ring-offset-white'

/** Botão amarelo "3D" (mesmo visual do antigo "Bora começar!"). */
export const botaoPrincipal = [
  'inline-flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-[#1e2546] bg-[#f9bd15] px-7 py-3 text-lg font-bold text-[#1e2546]',
  'shadow-[0_5px_0_#1e2546] transition-[transform,box-shadow,background-color] duration-150',
  'hover:-translate-y-0.5 hover:bg-[#ffc933] hover:shadow-[0_7px_0_#1e2546]',
  'active:translate-y-1 active:shadow-[0_1px_0_#1e2546]',
  'disabled:cursor-wait disabled:translate-y-0 disabled:bg-[#fbd56b] disabled:shadow-[0_5px_0_#1e2546]',
  foco,
].join(' ')

/** Botão de contorno (ações secundárias: Voltar, Sou professor ou administrador). */
export const botaoSecundario = [
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[#1e2546] bg-white px-6 py-2.5 text-base font-bold text-[#1e2546]',
  'transition-colors duration-150 hover:bg-[#eef3ff]',
  foco,
].join(' ')

/** Link discreto com área de toque de 48px. */
export const linkDiscreto = [
  'inline-flex min-h-12 items-center justify-center rounded-full px-3 text-base font-bold text-[#2f55c0] underline underline-offset-4 hover:text-[#1e2546]',
  foco,
].join(' ')

export const rotulo = 'text-base font-bold text-[#1e2546]'

export const textoApoio = 'text-sm font-medium text-[#3a4266]'

export const textoErro = 'text-sm font-bold text-[#b3261e]'

export const campo = [
  'block min-h-12 w-full rounded-2xl border-2 border-[#1e2546]/35 bg-white px-4 py-2.5 text-base font-semibold text-[#1e2546]',
  'placeholder:font-medium placeholder:text-[#6b7290]',
  'transition-colors focus:border-[#426cda] focus:outline-none focus:ring-4 focus:ring-[#426cda]/25',
  'aria-[invalid=true]:border-[#b3261e] aria-[invalid=true]:focus:ring-[#b3261e]/20',
].join(' ')

/** Caixa de alerta (erro geral). A região existe no DOM antes da mensagem aparecer. */
export const alertaErro =
  'rounded-2xl border-2 border-[#b3261e]/40 bg-[#fdecea] px-4 py-3 text-left text-sm font-bold text-[#8c1d18]'
