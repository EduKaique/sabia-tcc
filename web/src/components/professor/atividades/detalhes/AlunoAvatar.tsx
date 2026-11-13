import Image from "next/image";
import { AvatarSabia } from "@/components/aluno/primeiro-acesso/AvatarSabia";
import { buscarAvatar } from "@/lib/avatares";

const COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-pink-500",
];

function getInitials(nome: string | null): string {
  if (!nome) return '?';
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface Props {
  nome: string | null;
  fotoUrl: string | null;
  /** Id do catálogo de avatares do aluno (lib/avatares.ts); se válido, usa o mesmo desenho do aluno. */
  avatarId?: string | null;
}

export function AlunoAvatar({ nome, fotoUrl, avatarId }: Props) {
  if (avatarId && buscarAvatar(avatarId)) {
    return <AvatarSabia id={avatarId} tamanho={32} />;
  }


  if (fotoUrl) {
    return (
      <Image
        src={fotoUrl}
        alt={nome ?? 'Aluno sem nome'}
        width={32}
        height={32}
        className="w-8 h-8 rounded-full object-cover shrink-0"
      />
    );
  }

  const color = COLORS[(nome?.charCodeAt(0) ?? 0) % COLORS.length];
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${color}`}
    >
      {getInitials(nome)}
    </div>
  );
}
