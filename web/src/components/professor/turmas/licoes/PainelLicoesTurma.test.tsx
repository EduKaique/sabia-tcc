// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ProgressoLicoesTurma } from "@/types/licaoProfessor";
import { montarListaMovel, montarMatriz } from "@/lib/licoes/painelProgresso";
import { PainelLicoesTurma } from "./PainelLicoesTurma";
import { MatrizProgressoLicoes } from "./MatrizProgressoLicoes";
import { ListaProgressoMovel } from "./ListaProgressoMovel";

// Só a exibição é testada: o hook de rede devolve o estado que cada teste montar.
const consulta = vi.hoisted(() => ({
  atual: {} as Record<string, unknown>,
}));
vi.mock("@/hooks/useProgressoLicoesTurma", () => ({
  useProgressoLicoesTurma: () => consulta.atual,
}));

const refetch = vi.fn();
const estado = (extra: Record<string, unknown>) => {
  consulta.atual = {
    data: undefined,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch,
    ...extra,
  };
};

beforeEach(() => refetch.mockReset());
afterEach(cleanup);

const resposta = (extra: Partial<ProgressoLicoesTurma> = {}): ProgressoLicoesTurma => ({
  turmaId: 10,
  turmaNome: "5º A",
  totalAlunos: 2,
  licoes: [
    {
      id: 3,
      titulo: "Sequência de comandos",
      conceito: "Algoritmo",
      modo: "BLOCOS",
      totalPaginas: 4,
      publicadaEm: "2026-11-01T10:00:00",
      concluiram: 1,
    },
    {
      id: 1,
      titulo: "Repetição",
      conceito: "Laços",
      modo: "BLOCOS",
      totalPaginas: 2,
      publicadaEm: "2026-11-02T10:00:00",
      concluiram: 0,
    },
  ],
  alunos: [
    {
      alunoId: 8,
      nome: "Álvaro",
      celulas: [
        {
          licaoId: 3,
          estado: "CONCLUIDA",
          paginasConcluidas: 4,
          melhorPercentualQuestionario: 100,
          atividadeConcluida: true,
          concluidaEm: "2026-11-12T12:00:00",
        },
        {
          licaoId: 1,
          estado: "EM_ANDAMENTO",
          paginasConcluidas: 1,
          melhorPercentualQuestionario: 40,
          atividadeConcluida: false,
          concluidaEm: null,
        },
      ],
    },
    {
      alunoId: 2,
      nome: "Bruno",
      celulas: [
        {
          licaoId: 3,
          estado: "NAO_INICIADA",
          paginasConcluidas: 0,
          melhorPercentualQuestionario: null,
          atividadeConcluida: false,
          concluidaEm: null,
        },
        {
          licaoId: 1,
          estado: "PRATICA_LIBERADA",
          paginasConcluidas: 2,
          melhorPercentualQuestionario: null,
          atividadeConcluida: false,
          concluidaEm: null,
        },
      ],
    },
  ],
  ...extra,
});

describe("MatrizProgressoLicoes", () => {
  it("cabeçalho com link para o editor e o resumo, uma célula por aluno e lição com texto do estado", () => {
    render(<MatrizProgressoLicoes matriz={montarMatriz(resposta())} />);
    const link = screen.getByRole("link", { name: "Sequência de comandos" });
    expect(link.getAttribute("href")).toBe("/professor/licoes/3/editar");
    expect(link.getAttribute("title")).toBe("Sequência de comandos");
    expect(screen.getByText("1 de 2 concluíram")).toBeTruthy();
    expect(screen.getByText("0 de 2 concluíram")).toBeTruthy();

    const linhas = screen.getAllByRole("row").slice(1);
    expect(linhas).toHaveLength(2);
    expect(within(linhas[0]).getByRole("rowheader").textContent).toBe("Álvaro");
    expect(within(linhas[0]).getAllByRole("cell")).toHaveLength(2);
    expect(within(linhas[1]).getAllByRole("cell")).toHaveLength(2);

    expect(screen.getByText("Concluída em 12/11/2026")).toBeTruthy();
    expect(screen.getByText("Em andamento")).toBeTruthy();
    expect(screen.getByText("Não iniciada")).toBeTruthy();
    expect(screen.getByText("Prática liberada")).toBeTruthy();
    expect(screen.getByText("Questionário 40%")).toBeTruthy();
    expect(screen.getByText("1/2 páginas")).toBeTruthy();
    expect(
      screen.getByLabelText("Álvaro: Em andamento, 1 de 2 páginas, questionário 40%")
    ).toBeTruthy();
    expect(screen.getByLabelText("Bruno: Não iniciada, 0 de 4 páginas")).toBeTruthy();
  });
});

describe("ListaProgressoMovel", () => {
  it("mostra as lições de cada aluno com estado, páginas e percentual", () => {
    render(<ListaProgressoMovel cartoes={montarListaMovel(resposta())} />);
    const cartoes = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.closest("li") as HTMLElement);
    expect(cartoes.map((c) => within(c).getByRole("heading").textContent)).toEqual([
      "Álvaro",
      "Bruno",
    ]);
    expect(
      within(cartoes[0]).getByRole("link", { name: "Sequência de comandos" }).getAttribute("href")
    ).toBe("/professor/licoes/3/editar");
    expect(within(cartoes[0]).getByText("Questionário 100%")).toBeTruthy();
    expect(within(cartoes[1]).getByText("Prática liberada")).toBeTruthy();
    expect(within(cartoes[1]).getByText("2/2 páginas")).toBeTruthy();
  });
});

describe("PainelLicoesTurma", () => {
  it("com dados: resumo, legenda dos 4 estados, matriz e lista móvel, e Atualizar chama refetch", () => {
    estado({ data: resposta() });
    render(<PainelLicoesTurma turmaId={10} />);
    expect(screen.getByRole("heading", { name: "Lições" })).toBeTruthy();
    expect(screen.getByText("2 alunos · 2 lições")).toBeTruthy();
    const legenda = screen.getByRole("list", { name: "Legenda dos estados" });
    expect(
      within(legenda)
        .getAllByRole("listitem")
        .map((i) => i.textContent)
    ).toEqual(["Não iniciada", "Em andamento", "Prática liberada", "Concluída"]);
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Repetição" })).toHaveLength(3); // cabeçalho da matriz + 1 por aluno na lista móvel
    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("carregando mostra o esqueleto", () => {
    estado({ isLoading: true, isFetching: true });
    render(<PainelLicoesTurma turmaId={10} />);
    expect(screen.getByLabelText("Carregando o progresso das lições")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Atualizar" }) as HTMLButtonElement).disabled).toBe(
      true
    );
  });

  it('erro mostra "Tentar de novo", que recarrega', () => {
    estado({ isError: true });
    render(<PainelLicoesTurma turmaId={10} />);
    expect(screen.getByText("Não foi possível carregar o progresso das lições")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("turma sem lições publicadas aponta para a página de Lições", () => {
    estado({
      data: resposta({
        licoes: [],
        alunos: [{ alunoId: 8, nome: "Álvaro", celulas: [] }],
        totalAlunos: 1,
      }),
    });
    render(<PainelLicoesTurma turmaId={10} />);
    expect(
      screen.getByText(/Nenhuma lição publicada para esta turma\. Crie e vincule em/)
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Lições" }).getAttribute("href")).toBe(
      "/professor/licoes"
    );
    expect(screen.getByText("1 aluno · 0 lições")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByRole("list", { name: "Legenda dos estados" })).toBeNull();
  });

  it("turma sem alunos", () => {
    estado({ data: resposta({ alunos: [], totalAlunos: 0 }) });
    render(<PainelLicoesTurma turmaId={10} />);
    expect(screen.getByText(/Nenhum aluno matriculado nesta turma/)).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });
});
