'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { VerLicao } from '@/components/professor/licoes/VerLicao'
import { Button } from '@/components/ui/button'

export default function VerLicaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <div className="mx-auto max-w-6xl min-w-0 px-4 py-6 sm:px-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" className="h-auto whitespace-normal" asChild>
          <Link href="/professor/licoes">
            <ArrowLeft size={16} />
            Voltar para as lições
          </Link>
        </Button>
      </div>
      <VerLicao licaoId={Number(id)} />
    </div>
  )
}
