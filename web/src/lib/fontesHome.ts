import { Fredoka, Nunito } from 'next/font/google'

/** Fontes da home e das telas de entrada do aluno ("/" e "/convite/[codigo]"). */
export const fredoka = Fredoka({ subsets: ['latin'], weight: ['500', '600', '700'] })
export const nunito = Nunito({ subsets: ['latin'], weight: ['500', '700', '800'] })
