import type { Metadata } from 'next'
import { HomeShell } from '@/components/home/HomeShell'
import { EntradaAluno } from '@/components/aluno/primeiro-acesso/EntradaAluno'

export const metadata: Metadata = {
  title: 'Convite para a turma — Sabiá',
  robots: { index: false },
}

/**
 * Link de convite que o professor compartilha. O código é validado no cliente, ao montar
 * (o nome da turma não é buscado no servidor).
 */
export default async function ConvitePage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params

  return (
    <HomeShell>
      <EntradaAluno codigoInicial={decodificar(codigo)} />
    </HomeShell>
  )
}

function decodificar(valor: string): string {
  try {
    return decodeURIComponent(valor)
  } catch {
    return valor
  }
}
