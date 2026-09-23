import type { Metadata } from 'next'
import { Suspense } from 'react'
import { BookOpen } from 'lucide-react'
import { RedefinirSenhaForm } from '@/components/auth/RedefinirSenhaForm'

export const metadata: Metadata = {
  title: 'Redefinir senha | Sabiá',
}

export default function RedefinirSenhaPage() {
  return (
    <div className="grid h-full lg:grid-cols-2">
      {/* Coluna esquerda — decorativa */}
      <div
        className="hidden flex-col items-center justify-center p-12 lg:flex"
        style={{
          background:
            'linear-gradient(135deg, var(--primary) 0%, var(--color-success-container) 100%)',
        }}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <BookOpen size={56} color="white" />
          <span className="font-heading text-4xl font-bold text-white">Sabiá</span>
          <p className="max-w-xs text-lg text-white/90">
            Sua jornada de programação lógica começa aqui.
          </p>
        </div>
      </div>

      {/* Coluna direita — formulário */}
      <div className="flex h-full items-center justify-center bg-background p-6 lg:p-12">
        <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-lg lg:p-8">
          <h1 className="mb-6 text-2xl font-semibold text-foreground">Redefinir senha</h1>
          <Suspense fallback={null}>
            <RedefinirSenhaForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
