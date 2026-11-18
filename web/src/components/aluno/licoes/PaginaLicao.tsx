'use client'

import { useEnviarPulso, useMutacoesLicao } from '@/hooks/useLicoes'
import type {
  ConteudoImagemTextoAluno,
  ConteudoQuestionarioAluno,
  ConteudoTextoAluno,
  ConteudoVideoAluno,
  PaginaAluno,
} from '@/types/licao'
import { PaginaImagem } from './PaginaImagem'
import { PaginaTexto } from './PaginaTexto'
import { PaginaVideo } from './PaginaVideo'
import { QuestionarioAluno } from './QuestionarioAluno'

/** Liga cada tipo de página às ações do servidor. Remontada (key) a cada troca de página. */
export function PaginaLicao({ licaoId, pagina }: { licaoId: number; pagina: PaginaAluno }) {
  const { marcarVista, responderQuestionario } = useMutacoesLicao(licaoId)
  const enviarPulso = useEnviarPulso(licaoId)
  const aoAbrir = () => marcarVista.mutate(pagina.id)

  switch (pagina.tipo) {
    case 'TEXTO':
      return <PaginaTexto conteudo={pagina.conteudo as ConteudoTextoAluno} progresso={pagina.progresso} aoAbrir={aoAbrir} />
    case 'IMAGEM_TEXTO':
      return (
        <PaginaImagem conteudo={pagina.conteudo as ConteudoImagemTextoAluno} progresso={pagina.progresso} aoAbrir={aoAbrir} />
      )
    case 'VIDEO_YOUTUBE':
      return (
        <PaginaVideo
          conteudo={pagina.conteudo as ConteudoVideoAluno}
          progresso={pagina.progresso}
          enviarPulso={() => enviarPulso(pagina.id)}
        />
      )
    case 'QUESTIONARIO':
      return (
        <QuestionarioAluno
          conteudo={pagina.conteudo as ConteudoQuestionarioAluno}
          progresso={pagina.progresso}
          enviar={(respostas) => responderQuestionario.mutateAsync({ paginaId: pagina.id, respostas })}
        />
      )
    default:
      return <p className="text-base text-tinta-apoio">Este tipo de conteúdo ainda não está disponível.</p>
  }
}
