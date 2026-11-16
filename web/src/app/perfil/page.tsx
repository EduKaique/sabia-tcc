import type { Metadata } from 'next'
import { cn } from '@/lib/utils'
import { HomeShell } from '@/components/home/HomeShell'
import { PerfilForm } from '@/components/auth/PerfilForm'
import styles from '@/styles/home.module.css'

export const metadata: Metadata = {
  title: 'Meu perfil | Sabiá',
}

/** Mesmo layout da troca de senha: serve aluno e professor. */
export default function PerfilPage() {
  return (
    <HomeShell>
      <div data-painel-aberto="" className="mt-6 w-full">
        <section
          aria-label="Meu perfil"
          className={cn(
            styles.rise,
            'mx-auto w-full max-w-md rounded-[2rem] border-2 border-tinta bg-white p-5 text-left shadow-[0_6px_0_#1e2546] sm:max-w-lg sm:p-7',
          )}
        >
          <PerfilForm />
        </section>
      </div>
    </HomeShell>
  )
}
