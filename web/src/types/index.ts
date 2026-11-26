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

export type TipoAtividade = 'ATIVIDADE_AVALIATIVA'

/** Modo de apresentação da atividade, ortogonal ao tipo. `null` no backend é tratado como BLOCOS. */
export type ModoAtividade = 'BLOCOS' | 'JOGO_ROBO'

export type TipoBlocoRobo = 'robo_mover' | 'robo_repetir'

export interface PosicaoRobo {
  linha: number
  coluna: number
}

/** Conteúdo de `cenarioJson` nas atividades do modo Jogo do Robô. */
export interface CenarioRobo {
  versao: number
  linhas: number
  colunas: number
  inicio: PosicaoRobo
  destino: PosicaoRobo
  obstaculos: PosicaoRobo[]
  blocosPermitidos: TipoBlocoRobo[]
  maxBlocos?: number
}

export interface AtividadeAvaliativa {
  id: string
  titulo: string
  descricao: string | null
  turmaId: number
  pontuacaoMaxima: number
  dataEntrega: Date | undefined
  gabaritoEstadoJson: string
  status: StatusAtividade
  criadaEm: string
  modo: ModoAtividade
  cenarioJson: string | null
  possuiNotas: boolean
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

/** Aluno da turma com dados de conta (auth-service). Sem CPF, e-mail nem data de nascimento. */
export interface AlunoDaTurma {
  alunoId: number
  nome: string | null
  matricula: string | null
  avatar: string | null
  ingressoEm: string
  trocaSenhaPendente: boolean
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
  criadaEm: string
  totalAlunos: number
  totalEntregas: number
  mediaTurma: number | null
}

export type StatusSubmissao = 'PENDENTE' | 'CORRIGIDA'

export interface SubmissaoItem {
  id: string
  alunoId: string
  alunoNome: string | null
  alunoFotoUrl: string | null
  nomeArquivo: string | null
  entregueComAtraso: boolean
  status: StatusSubmissao
  nota: number | null
  enviadaEm: string | null
}

export interface CorrigirSubmissaoPayload {
  nota: number
  feedbackProfessor: string
}

export interface Correcao {
  id: number
  nota: number
  feedbackProfessor: string | null
  corrigidaEm: string
}

export interface SubmissaoAvaliativa {
  id: number
  atividadeId: number
  enviadaEm: string
  status: StatusSubmissao
  correcao: Correcao | null
}

export interface SubmissaoProfessorDetalhe {
  id: number
  atividadeId: number
  alunoNome: string | null
  enviadaEm: string
  status: StatusSubmissao
  estadoJson: string | null
  correcao: Correcao | null
  relatorioIaPreGeradoJson?: string | null
  /** Resultado validado no servidor na entrega; nulo em entregas antigas. */
  validacao?: ResultadoValidacao | null
  /** Métricas e pseudocódigo do programa (Jogo do Robô), calculados pelo servidor; nulo nos demais casos. */
  analiseRobo?: AnaliseRobo | null
}

/** AnaliseRobo do pedagogico-service (fixtures/robo/README.md, "Análise para o relatório"). */
export interface AnaliseRobo {
  status: StatusPratica
  concluida: boolean
  blocosUsados: number
  totalBlocosWorkspace: number
  maxBlocos: number | null
  blocosSoltos: number
  excedeuLimiteBlocos: boolean
  usouBlocoNaoPermitido: boolean
  passosExecutados: number
  passosMinimos: number | null
  eficiencia: number | null
  quantidadeRepetir: number
  profundidadeMaxima: number
  maiorSequenciaIgual: number
  sequenciaRepetivel: boolean
  distanciaAoDestino: number | null
  pseudocodigo: string
  pseudocodigoTruncado: boolean
}

/** Status da validação da prática no servidor: os do simulador do robô mais os de blocos livres. */
export type StatusPratica =
  | 'CHEGOU'
  | 'NAO_CHEGOU'
  | 'COLIDIU'
  | 'SAIU_DO_GRID'
  | 'SEM_BLOCOS'
  | 'LIMITE_EXCEDIDO'
  | 'BLOCOS_LIVRES_OK'
  | 'BLOCOS_LIVRES_VAZIO'

/** ResultadoValidacao do pedagogico-service (fixtures/blocos-livres/README.md). */
export interface ResultadoValidacao {
  versaoValidador: number
  modo: ModoAtividade
  concluida: boolean
  status: StatusPratica
  blocosUsados: number
  totalBlocosWorkspace: number
  maxBlocos: number | null
  excedeuLimiteBlocos: boolean
  usouBlocoNaoPermitido: boolean
  passosExecutados: number
  blocosSoltos: number
  posicaoFinal: PosicaoRobo | null
  motivo: string | null
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
  corrigidas: number
  entreguesNoPrazo: number
  entreguesComAtraso: number
}
