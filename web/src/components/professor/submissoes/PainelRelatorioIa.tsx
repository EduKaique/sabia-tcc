import { useState } from 'react'
import type { RelatorioIa } from '@/types'
import { useRevisarSubmissaoIa } from '@/hooks/useRevisarSubmissaoIa'
import type { RevisarSubmissaoIaPayload } from '@/services/ia'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function lerRelatorio(json: string | null | undefined): RelatorioIa | null {
  if (!json) return null
  try {
    const dados = JSON.parse(json)
    if (!dados || typeof dados !== 'object') return null
    const relatorio: RelatorioIa = {
      notaSugerida: typeof dados.notaSugerida === 'number' ? dados.notaSugerida : undefined,
      acertos: Array.isArray(dados.acertos) ? dados.acertos.filter((a: unknown) => typeof a === 'string') : undefined,
      erros: Array.isArray(dados.erros)
        ? dados.erros.filter((e: { descricao?: unknown }) => typeof e?.descricao === 'string')
        : undefined,
      resumo: typeof dados.resumo === 'string' ? dados.resumo : undefined,
    }
    const temDados =
      relatorio.notaSugerida !== undefined ||
      !!relatorio.acertos?.length ||
      !!relatorio.erros?.length ||
      !!relatorio.resumo
    return temDados ? relatorio : null
  } catch {
    return null
  }
}

interface Props {
  relatorioIaJson: string | null | undefined
  payload: RevisarSubmissaoIaPayload | null
}

export function PainelRelatorioIa({ relatorioIaJson, payload }: Props) {
  const revisar = useRevisarSubmissaoIa()
  const [relatorioGerado, setRelatorioGerado] = useState<RelatorioIa | null>(null)
  const relatorio = relatorioGerado ?? lerRelatorio(relatorioIaJson)

  function gerarRelatorio() {
    if (!payload) return
    revisar.mutate(payload, {
      onSuccess: setRelatorioGerado,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório da IA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-foreground">
        {!relatorio ? (
          <div className="space-y-3">
            <p className="text-muted-foreground">Relatório de IA ainda não disponível.</p>
            <Button onClick={gerarRelatorio} disabled={!payload || revisar.isPending}>
              {revisar.isPending ? 'Gerando relatório...' : 'Gerar relatório com IA'}
            </Button>
            {revisar.isError && (
              <p className="text-sm text-destructive">
                Não foi possível gerar o relatório. Tente novamente.
              </p>
            )}
          </div>
        ) : (
          <>
            {relatorio.notaSugerida !== undefined && (
              <p>
                <span className="font-medium">Nota sugerida:</span> {relatorio.notaSugerida}
              </p>
            )}
            {!!relatorio.acertos?.length && (
              <div>
                <p className="font-medium">Acertos</p>
                <ul className="list-disc pl-5">
                  {relatorio.acertos.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
            {!!relatorio.erros?.length && (
              <div>
                <p className="font-medium">Erros encontrados</p>
                <ul className="list-disc pl-5">
                  {relatorio.erros.map((e, i) => (
                    <li key={i}>
                      {e.descricao}
                      {e.severidade && <span className="text-muted-foreground"> ({e.severidade})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {relatorio.resumo && (
              <div>
                <p className="font-medium">Resumo</p>
                <p className="whitespace-pre-wrap">{relatorio.resumo}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
