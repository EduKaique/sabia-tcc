import type { EstadoLicaoAluno } from "@/types/licao";
import type {
  AlunoProgressoLicao,
  PaginaProgressoAluno,
  ProgressoLicaoProfessor,
} from "@/types/licaoProfessor";
import { formatarDataUtc } from "@/components/professor/licoes/estadoLicao";
import { ROTULO_ESTADO_ALUNO, ROTULO_TIPO_ALUNO } from "./aluno";

/** Regras puras do relatório de progresso da lição (professor). Nunca só cor: sempre ícone e texto. */

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
  celula: Pick<AlunoProgressoLicao, "estado" | "concluidaEm">
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
  celula: Pick<
    AlunoProgressoLicao,
    "estado" | "concluidaEm" | "paginasConcluidas" | "melhorPercentualQuestionario"
  >,
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

// ---------- modelo da tela "Ver lição" ----------

export interface ColunaPagina {
  id: number;
  /** "1 · Texto". */
  rotulo: string;
  titulo: string | null;
}

export interface CelulaPagina {
  paginaId: number;
  concluida: boolean;
  /** "Concluída" ou "Pendente". */
  texto: string;
  /** No questionário: "80% · 2 tentativas" ou "Não tentou". */
  detalhe: string | null;
  ariaLabel: string;
}

export interface AlunoRelatorio {
  alunoId: number;
  nome: string;
  estado: EstadoLicaoAluno;
  textoEstado: string;
  classe: string;
  icone: IconeEstado;
  paginas: string;
  questionario: string | null;
  pratica: string;
  ariaLabel: string;
  celulas: CelulaPagina[];
}

export interface GrupoTurma {
  turmaId: number;
  turmaNome: string;
  alunos: AlunoRelatorio[];
}

export interface RelatorioLicao {
  colunas: ColunaPagina[];
  grupos: GrupoTurma[];
  /** "N de M concluíram". */
  resumo: string;
}

const tentativas = (n: number) => `${n} ${n === 1 ? "tentativa" : "tentativas"}`;

/** Situação de uma página para um aluno. */
export function textoPaginaAluno(
  tipo: ProgressoLicaoProfessor["paginas"][number]["tipo"],
  p: PaginaProgressoAluno | undefined
): Pick<CelulaPagina, "concluida" | "texto" | "detalhe"> {
  const concluida = !!p?.concluida;
  let detalhe: string | null = null;
  if (tipo === "QUESTIONARIO") {
    detalhe =
      p?.melhorPercentual != null
        ? `${p.melhorPercentual}% · ${tentativas(p.tentativas ?? 0)}`
        : "Não tentou";
  }
  return { concluida, texto: concluida ? "Concluída" : "Pendente", detalhe };
}

/** Mantém a ordem do servidor (turmas, alunos e páginas); cada página do aluno é casada pelo id. */
export function montarRelatorioLicao(r: ProgressoLicaoProfessor): RelatorioLicao {
  const colunas = r.paginas.map((p, i) => ({
    id: p.id,
    rotulo: `${i + 1} · ${ROTULO_TIPO_ALUNO[p.tipo]}`,
    titulo: p.titulo,
  }));
  const grupos = r.turmas.map((t) => ({
    turmaId: t.turmaId,
    turmaNome: t.turmaNome,
    alunos: t.alunos.map((a) => {
      const porPagina = new Map(a.paginas.map((p) => [p.paginaId, p]));
      return {
        alunoId: a.alunoId,
        nome: a.nome,
        estado: a.estado,
        textoEstado: textoEstadoCelula(a),
        classe: classeEstado(a.estado),
        icone: iconeEstado(a.estado),
        paginas: textoPaginas(a.paginasConcluidas, r.paginas.length),
        questionario: textoQuestionario(a.melhorPercentualQuestionario),
        pratica: a.atividadeConcluida ? "Prática concluída" : "Prática pendente",
        ariaLabel: ariaLabelCelula(a.nome, a, r.paginas.length),
        celulas: r.paginas.map((pagina, i) => {
          const situacao = textoPaginaAluno(pagina.tipo, porPagina.get(pagina.id));
          const extra = situacao.detalhe ? `, ${situacao.detalhe}` : "";
          return {
            paginaId: pagina.id,
            ...situacao,
            ariaLabel: `${a.nome}, página ${i + 1} (${ROTULO_TIPO_ALUNO[pagina.tipo]}): ${situacao.texto}${extra}`,
          };
        }),
      };
    }),
  }));
  return { colunas, grupos, resumo: resumoColuna(r.concluiram, r.totalAlunos) };
}
