const COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-pink-500',
]

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface Props {
  nome: string
  fotoUrl: string | null
}

export function AlunoAvatar({ nome, fotoUrl }: Props) {
  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nome}
        className="w-8 h-8 rounded-full object-cover shrink-0"
      />
    )
  }

  const color = COLORS[nome.charCodeAt(0) % COLORS.length]
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${color}`}
    >
      {getInitials(nome)}
    </div>
  )
}
