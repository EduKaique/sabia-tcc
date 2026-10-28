export interface ApiResponse<T> {
  data: T
  message?: string
  timestamp: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export type StatusAtividade = 'RASCUNHO' | 'PUBLICADA'

export type TipoAtividade =
  | 'ATIVIDADE_AVALIATIVA'
  | 'ATIVIDADE_TRILHA'

export interface AtividadeAvaliativa {
  id: string
  titulo: string
  descricao: string | null
  turmaId: number
  pontuacaoMaxima: number
  dataEntrega: Date | undefined
  eGeradaIa: boolean
  gabaritoEstadoJson: string
  status: StatusAtividade
  criadaEm: string
}

export type EtapaEnsino = 'ANOS_INICIAIS' | 'ANOS_FINAIS' | 'MEDIO' | 'TECNICO'

export type Turno = 'MANHA' | 'TARDE' | 'NOITE' | 'INTEGRAL'

export interface Turma {
  id: number
  nome: string
  etapa: EtapaEnsino
  anoSerie: string | null
  turno: Turno | null
  codigoConvite: string | null
}

export interface AlunoMatriculado {
  alunoId: number
  alunoNome: string | null
  ingressoEm: string
}

export interface AlunoBusca {
  id: number
  nome: string
  email: string | null
  matricula: string | null
}

export interface AtividadeDetalhes {
  id: string
  titulo: string
  descricao: string
  turmaNome: string
  dataEntrega: string | null
  pontuacaoMaxima: number
  status: 'RASCUNHO' | 'PUBLICADA'
  eGeradaIa: boolean
  criadaEm: string
  totalAlunos: number
  totalEntregas: number
  mediaTurma: number | null
}

export type StatusSubmissao = 'PENDENTE' | 'EM_CORRECAO' | 'CORRIGIDA'

export interface SubmissaoItem {
  id: string
  alunoId: string
  alunoNome: string | null
  alunoFotoUrl: string | null
  nomeArquivo: string | null
  entregueComAtraso: boolean
  status: StatusSubmissao
  nota: number | null
  dataEnvio: string | null
}

export interface CorrigirSubmissaoPayload {
  nota: number
  feedbackProfessor: string
}

export interface Correcao {
  id: number
  nota: number
  feedbackProfessor: string | null
  relatorioIaJson: string | null
  avaliadaEm: string
}

export interface SubmissaoAvaliativa {
  id: number
  atividadeId: number
  dataEnvio: string
  status: StatusSubmissao
  correcao: Correcao | null
}

export interface SubmissaoProfessorDetalhe {
  id: number
  atividadeId: number
  alunoNome: string | null
  dataEnvio: string
  status: StatusSubmissao
  estadoJson: string | null
  correcao: Correcao | null
}

export interface ErroApi {
  status: number
  erro: string
  timestamp: string
  campos?: Record<string, string>
}

export interface RelatorioIa {
  resumo?: string
  notaSugerida?: number
  acertos?: string[]
  erros?: { descricao: string; severidade?: string }[]
}

export type TipoRelatorio = 'GERAL' | 'TURMAS' | 'ATIVIDADES'

export interface RelatorioRequest {
  tipo?: TipoRelatorio
  turmaId?: number
  atividadeId?: string
  dataInicio?: string
  dataFim?: string
  incluirDetalhes?: boolean
}

export interface RelatorioTurma {
  turmaId: number
  turmaNome: string
  totalAlunos: number
  totalAtividades: number
  totalEntregas: number
  taxaEntrega: number
  mediaTurma: number | null
}

export interface RelatorioAtividade {
  atividadeId: string
  atividadeTitulo: string
  turmaNome: string
  totalAlunos: number
  totalEntregas: number
  taxaEntrega: number
  media: number | null
}

export interface RelatorioProfessor {
  totalTurmas: number
  totalAlunos: number
  totalAtividades: number
  totalEntregas: number
  taxaEntrega: number
  taxaCorrecao: number
  mediaGeral: number | null
  turmas: RelatorioTurma[]
  atividades: RelatorioAtividade[]
}

export interface FiltroPeriodoTurma {
  atividadeId?: string
  dataInicio?: string
  dataFim?: string
}

export interface MediaAtividade {
  atividadeId: number
  atividadeTitulo: string
  pontuacaoMaxima: number
  media: number | null
  mediaPercentual: number | null
  totalEntregas: number
  totalCorrigidas: number
  totalAlunos: number
  taxaEntrega: number
}

export interface FaixaNota {
  faixa: string
  quantidade: number
}

export interface DistribuicaoNotas {
  faixas: FaixaNota[]
  totalNotas: number
  mediaPercentual: number | null
  medianaPercentual: number | null
}

export interface ProgressaoAluno {
  alunoId: number
  alunoNome: string
  mediaPercentual: number | null
  notasPercentuais: (number | null)[]
}

export interface ProgressaoTurma {
  atividades: { atividadeId: number; titulo: string }[]
  alunos: ProgressaoAluno[]
  mediaTurma: (number | null)[]
}

export interface StatusEntregas {
  totalEsperado: number
  naoEntregues: number
  pendentes: number
  emCorrecao: number
  corrigidas: number
  entreguesNoPrazo: number
  entreguesComAtraso: number
}
