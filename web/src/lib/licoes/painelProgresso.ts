import type { EstadoLicaoAluno } from "@/types/licao";
import type {
  CelulaProgressoLicao,
  ColunaLicaoProgresso,
  ProgressoLicoesTurma,
} from "@/types/licaoProfessor";
import { formatarDataUtc } from "@/components/professor/licoes/estadoLicao";
import { ROTULO_ESTADO_ALUNO } from "./aluno";

/** Regras puras do painel de progresso das lições da turma (professor). Nunca só cor: sempre ícone e texto. */

/** Ordem da legenda. */
export const ESTADOS_PAINEL: readonly EstadoLicaoAluno[] = [
  "NAO_INICIADA",
  "EM_ANDAMENTO",
  "PRATICA_LIBERADA",
  "CONCLUIDA",
];

export type IconeEstado = "traco" | "relogio" | "cadeado-aberto" | "check";

const ICONE: Record<EstadoLicaoAluno, IconeEstado> = {
  NAO_INICIADA: "traco",
  EM_ANDAMENTO: "relogio",
  PRATICA_LIBERADA: "cadeado-aberto",
  CONCLUIDA: "check",
};

const CLASSE: Record<EstadoLicaoAluno, string> = {
  NAO_INICIADA: "border-border bg-muted/40 text-muted-foreground",
  EM_ANDAMENTO: "border-amber-300 bg-amber-50 text-amber-900",
  PRATICA_LIBERADA: "border-blue-300 bg-blue-50 text-blue-900",
  CONCLUIDA: "border-green-300 bg-green-50 text-green-900",
};

export const rotuloEstado = (estado: EstadoLicaoAluno): string => ROTULO_ESTADO_ALUNO[estado];
export const iconeEstado = (estado: EstadoLicaoAluno): IconeEstado => ICONE[estado];
export const classeEstado = (estado: EstadoLicaoAluno): string => CLASSE[estado];

/** "Concluída em dd/MM/aaaa" quando há data; senão o rótulo do estado. */
export function textoEstadoCelula(
  celula: Pick<CelulaProgressoLicao, "estado" | "concluidaEm">
): string {
  if (celula.estado === "CONCLUIDA" && celula.concluidaEm) {
    const data = formatarDataUtc(celula.concluidaEm);
    if (data !== "—") return `Concluída em ${data}`;
  }
  return rotuloEstado(celula.estado);
}

export const textoPaginas = (concluidas: number, total: number): string =>
  `${concluidas}/${total} páginas`;

export function textoQuestionario(percentual: number | null): string | null {
  return percentual == null ? null : `Questionário ${percentual}%`;
}

/** Ex.: "Maria: Em andamento, 2 de 4 páginas, questionário 80%". */
export function ariaLabelCelula(
  nome: string,
  celula: CelulaProgressoLicao,
  totalPaginas: number
): string {
  const partes = [
    textoEstadoCelula(celula),
    `${celula.paginasConcluidas} de ${totalPaginas} páginas`,
  ];
  if (celula.melhorPercentualQuestionario != null) {
    partes.push(`questionário ${celula.melhorPercentualQuestionario}%`);
  }
  return `${nome}: ${partes.join(", ")}`;
}

/** "N de M concluíram". */
export const resumoColuna = (concluiram: number, totalAlunos: number): string =>
  `${concluiram} de ${totalAlunos} concluíram`;

/** "N alunos · M lições", com singular. */
export function resumoTurma(totalAlunos: number, totalLicoes: number): string {
  const alunos = `${totalAlunos} ${totalAlunos === 1 ? "aluno" : "alunos"}`;
  const licoes = `${totalLicoes} ${totalLicoes === 1 ? "lição" : "lições"}`;
  return `${alunos} · ${licoes}`;
}

export const linkEditorLicao = (id: number): string => `/professor/licoes/${id}/editar`;

// ---------- modelo das telas ----------

export interface ColunaPainel {
  id: number;
  titulo: string;
  href: string;
  resumo: string;
}

export interface CelulaPainel {
  licaoId: number;
  estado: EstadoLicaoAluno;
  rotulo: string;
  textoEstado: string;
  paginas: string;
  questionario: string | null;
  ariaLabel: string;
  classe: string;
  icone: IconeEstado;
}

export interface LinhaPainel {
  alunoId: number;
  nome: string;
  celulas: CelulaPainel[];
}

export interface MatrizPainel {
  colunas: ColunaPainel[];
  linhas: LinhaPainel[];
}

const vazia = (licaoId: number): CelulaProgressoLicao => ({
  licaoId,
  estado: "NAO_INICIADA",
  paginasConcluidas: 0,
  melhorPercentualQuestionario: null,
  atividadeConcluida: false,
  concluidaEm: null,
});

export function montarCelula(
  nome: string,
  coluna: ColunaLicaoProgresso,
  celula: CelulaProgressoLicao
): CelulaPainel {
  return {
    licaoId: coluna.id,
    estado: celula.estado,
    rotulo: rotuloEstado(celula.estado),
    textoEstado: textoEstadoCelula(celula),
    paginas: textoPaginas(celula.paginasConcluidas, coluna.totalPaginas),
    questionario: textoQuestionario(celula.melhorPercentualQuestionario),
    ariaLabel: ariaLabelCelula(nome, celula, coluna.totalPaginas),
    classe: classeEstado(celula.estado),
    icone: iconeEstado(celula.estado),
  };
}

/** Mantém a ordem do servidor (colunas e linhas); a célula de cada coluna é casada pelo id da lição. */
export function montarMatriz(resposta: ProgressoLicoesTurma): MatrizPainel {
  const colunas = resposta.licoes.map((l) => ({
    id: l.id,
    titulo: l.titulo,
    href: linkEditorLicao(l.id),
    resumo: resumoColuna(l.concluiram, resposta.totalAlunos),
  }));
  const linhas = resposta.alunos.map((a) => {
    const porLicao = new Map(a.celulas.map((c) => [c.licaoId, c]));
    return {
      alunoId: a.alunoId,
      nome: a.nome,
      celulas: resposta.licoes.map((l) =>
        montarCelula(a.nome, l, porLicao.get(l.id) ?? vazia(l.id))
      ),
    };
  });
  return { colunas, linhas };
}

export interface LicaoCartao extends CelulaPainel {
  titulo: string;
  href: string;
}

export interface CartaoAluno {
  alunoId: number;
  nome: string;
  licoes: LicaoCartao[];
}

/** Celular: um cartão por aluno, com as lições em linhas (mesma ordem da matriz). */
export function montarListaMovel(resposta: ProgressoLicoesTurma): CartaoAluno[] {
  const { colunas, linhas } = montarMatriz(resposta);
  return linhas.map((linha) => ({
    alunoId: linha.alunoId,
    nome: linha.nome,
    licoes: linha.celulas.map((c, i) => ({
      ...c,
      titulo: colunas[i].titulo,
      href: colunas[i].href,
    })),
  }));
}
