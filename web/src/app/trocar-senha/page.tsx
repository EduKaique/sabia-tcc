import type { Metadata } from 'next'
import { cn } from '@/lib/utils'
import { HomeShell } from '@/components/home/HomeShell'
import { TrocarSenhaForm } from '@/components/auth/TrocarSenhaForm'
import styles from '@/styles/home.module.css'

export const metadata: Metadata = {
  title: 'Trocar senha | Sabiá',
}

/** Mesmo layout do login e do primeiro acesso (HomeShell + card do EntradaAluno). */
export default function TrocarSenhaPage() {
  return (
    <HomeShell>
      {/* [data-painel-aberto] compacta título e arte via CSS, como no login aberto. */}
      <div data-painel-aberto="" className="mt-6 w-full">
        <section
          aria-label="Trocar senha"
          className={cn(
            styles.rise,
            'mx-auto w-full max-w-md rounded-[2rem] border-2 border-tinta bg-white p-5 text-left shadow-[0_6px_0_#1e2546] sm:max-w-lg sm:p-7',
          )}
        >
          <TrocarSenhaForm />
        </section>
      </div>
    </HomeShell>
  )
}
