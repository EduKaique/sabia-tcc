import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AtividadeForm } from '@/components/professor/atividades/AtividadeFormModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function NovaAtividadePage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/professor/atividades">
            <ArrowLeft size={18} />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nova atividade</h1>
          <p className="text-sm text-muted-foreground">Preencha os dados para criar uma nova atividade.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <AtividadeForm />
        </CardContent>
      </Card>
    </div>
  )
}
