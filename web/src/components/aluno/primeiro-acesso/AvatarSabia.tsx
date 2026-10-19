import Image from 'next/image'
import { buscarAvatar } from '@/lib/avatares'
import { cn } from '@/lib/utils'

interface AvatarSabiaProps {
  id: string
  tamanho?: number
  className?: string
  anunciar?: boolean
}

const TINTA = '#1e2546'
const CREME = '#fffdf7'

/**
 * Avatar do aluno. Usa a imagem final do catálogo (lib/avatares.ts) quando existir;
 * senão desenha o sabiá provisório em SVG, na cor do avatar.
 */
export function AvatarSabia({ id, tamanho = 64, className, anunciar = false }: AvatarSabiaProps) {
  const avatar = buscarAvatar(id)
  if (!avatar) return null

  const a11y = anunciar
    ? { role: 'img' as const, 'aria-label': `Avatar: ${avatar.rotulo}` }
    : { 'aria-hidden': true as const }

  if (avatar.imagem) {
    return (
      <Image
        src={avatar.imagem}
        alt={anunciar ? `Avatar: ${avatar.rotulo}` : ''}
        width={tamanho}
        height={tamanho}
        className={cn('rounded-full', className)}
      />
    )
  }

  return (
    <svg
      viewBox="0 0 64 64"
      width={tamanho}
      height={tamanho}
      focusable="false"
      className={cn('shrink-0', className)}
      {...a11y}
    >
      <circle cx="32" cy="32" r="32" fill={avatar.cor} />
      <circle cx="32" cy="32" r="27" fill="#ffffff" opacity="0.16" />

      {/* cauda */}
      <path
        d="M17 37 L6 29 L8 45 Z"
        fill={avatar.cor}
        stroke={TINTA}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* contorno de corpo + cabeça (desenhado antes do preenchimento para sumir a costura) */}
      <ellipse cx="29" cy="39" rx="15" ry="12.5" fill={CREME} stroke={TINTA} strokeWidth="2.5" />
      <circle cx="42" cy="26" r="10" fill={CREME} stroke={TINTA} strokeWidth="2.5" />
      <ellipse cx="29" cy="39" rx="13.75" ry="11.25" fill={CREME} />
      <circle cx="42" cy="26" r="8.75" fill={CREME} />

      {/* peito na cor do avatar */}
      <ellipse cx="33" cy="42" rx="8" ry="6.5" fill={avatar.cor} opacity="0.45" />

      {/* asa */}
      <ellipse
        cx="25"
        cy="38"
        rx="9"
        ry="5.5"
        transform="rotate(-18 25 38)"
        fill={avatar.cor}
        stroke={TINTA}
        strokeWidth="2"
      />

      {/* bico */}
      <path
        d="M50.5 24 L58 27 L50.5 30 Z"
        fill="#f9bd15"
        stroke={TINTA}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* olho e bochecha */}
      <circle cx="45" cy="23.5" r="2.6" fill={TINTA} />
      <circle cx="45.9" cy="22.6" r="0.9" fill="#ffffff" />
      <circle cx="41" cy="29.5" r="2.2" fill="#ff8fa8" opacity="0.75" />

      {/* perninhas */}
      <path
        d="M27 51 L26 56 M33 51 L34 56"
        stroke={TINTA}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
