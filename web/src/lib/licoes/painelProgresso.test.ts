import { describe, expect, it } from "vitest";
import type { ProgressoLicoesTurma } from "@/types/licaoProfessor";
import {
  ESTADOS_PAINEL,
  ariaLabelCelula,
  classeEstado,
  iconeEstado,
  montarListaMovel,
  montarMatriz,
  resumoColuna,
  resumoTurma,
  rotuloEstado,
  textoEstadoCelula,
  textoPaginas,
  textoQuestionario,
} from "./painelProgresso";

// Meio-dia UTC: a data é a mesma em qualquer fuso do Brasil (o formatador usa o fuso local).
const CONCLUIDA_EM = "2026-11-12T12:00:00";

const resposta = (): ProgressoLicoesTurma => ({
  turmaId: 10,
  turmaNome: "5º A",
  totalAlunos: 2,
  licoes: [
    {
      id: 3,
      titulo: "Sequência",
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
      modo: "JOGO_ROBO",
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
          concluidaEm: CONCLUIDA_EM,
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
});

describe("estado: rótulo, ícone e classe", () => {
  it("cada um dos quatro estados tem rótulo, ícone e cor próprios", () => {
    expect(ESTADOS_PAINEL.map(rotuloEstado)).toEqual([
      "Não iniciada",
      "Em andamento",
      "Prática liberada",
      "Concluída",
    ]);
    expect(ESTADOS_PAINEL.map(iconeEstado)).toEqual([
      "traco",
      "relogio",
      "cadeado-aberto",
      "check",
    ]);
    expect(classeEstado("NAO_INICIADA")).toContain("muted");
    expect(classeEstado("EM_ANDAMENTO")).toContain("amber");
    expect(classeEstado("PRATICA_LIBERADA")).toContain("blue");
    expect(classeEstado("CONCLUIDA")).toContain("green");
  });
});

describe("textos da célula", () => {
  it("concluída mostra a data em dd/MM/aaaa", () => {
    expect(textoEstadoCelula({ estado: "CONCLUIDA", concluidaEm: CONCLUIDA_EM })).toBe(
      "Concluída em 12/11/2026"
    );
    expect(textoEstadoCelula({ estado: "CONCLUIDA", concluidaEm: null })).toBe("Concluída");
    expect(textoEstadoCelula({ estado: "EM_ANDAMENTO", concluidaEm: null })).toBe("Em andamento");
  });

  it("páginas e questionário", () => {
    expect(textoPaginas(2, 4)).toBe("2/4 páginas");
    expect(textoQuestionario(80)).toBe("Questionário 80%");
    expect(textoQuestionario(0)).toBe("Questionário 0%");
    expect(textoQuestionario(null)).toBeNull();
  });

  it("aria-label completo, com e sem questionário", () => {
    const base = { licaoId: 1, atividadeConcluida: false, concluidaEm: null };
    expect(
      ariaLabelCelula(
        "Maria",
        { ...base, estado: "EM_ANDAMENTO", paginasConcluidas: 2, melhorPercentualQuestionario: 80 },
        4
      )
    ).toBe("Maria: Em andamento, 2 de 4 páginas, questionário 80%");
    expect(
      ariaLabelCelula(
        "João",
        {
          ...base,
          estado: "NAO_INICIADA",
          paginasConcluidas: 0,
          melhorPercentualQuestionario: null,
        },
        3
      )
    ).toBe("João: Não iniciada, 0 de 3 páginas");
    expect(
      ariaLabelCelula(
        "Ana",
        {
          ...base,
          estado: "CONCLUIDA",
          paginasConcluidas: 4,
          melhorPercentualQuestionario: 100,
          atividadeConcluida: true,
          concluidaEm: CONCLUIDA_EM,
        },
        4
      )
    ).toBe("Ana: Concluída em 12/11/2026, 4 de 4 páginas, questionário 100%");
  });

  it("resumos", () => {
    expect(resumoColuna(3, 12)).toBe("3 de 12 concluíram");
    expect(resumoTurma(12, 3)).toBe("12 alunos · 3 lições");
    expect(resumoTurma(1, 1)).toBe("1 aluno · 1 lição");
    expect(resumoTurma(0, 0)).toBe("0 alunos · 0 lições");
  });
});

describe("modelo das telas", () => {
  it("matriz preserva a ordem do servidor e alinha as células às colunas", () => {
    const { colunas, linhas } = montarMatriz(resposta());
    expect(colunas.map((c) => c.id)).toEqual([3, 1]);
    expect(colunas[0]).toEqual({
      id: 3,
      titulo: "Sequência",
      href: "/professor/licoes/3/editar",
      resumo: "1 de 2 concluíram",
    });
    expect(linhas.map((l) => l.nome)).toEqual(["Álvaro", "Bruno"]);
    expect(linhas[0].celulas.map((c) => c.licaoId)).toEqual([3, 1]);
    expect(linhas[0].celulas[0]).toMatchObject({
      estado: "CONCLUIDA",
      textoEstado: "Concluída em 12/11/2026",
      paginas: "4/4 páginas",
      questionario: "Questionário 100%",
      icone: "check",
    });
    expect(linhas[1].celulas[1]).toMatchObject({
      estado: "PRATICA_LIBERADA",
      paginas: "2/2 páginas",
      questionario: null,
    });
  });

  it('célula ausente vira "Não iniciada" sem quebrar o alinhamento', () => {
    const r = resposta();
    r.alunos[1].celulas = [r.alunos[1].celulas[1]];
    const { linhas } = montarMatriz(r);
    expect(linhas[1].celulas.map((c) => [c.licaoId, c.estado])).toEqual([
      [3, "NAO_INICIADA"],
      [1, "PRATICA_LIBERADA"],
    ]);
  });

  it("lista móvel: um cartão por aluno com as lições na mesma ordem", () => {
    const cartoes = montarListaMovel(resposta());
    expect(cartoes.map((c) => c.nome)).toEqual(["Álvaro", "Bruno"]);
    expect(cartoes[0].licoes.map((l) => [l.titulo, l.href, l.textoEstado])).toEqual([
      ["Sequência", "/professor/licoes/3/editar", "Concluída em 12/11/2026"],
      ["Repetição", "/professor/licoes/1/editar", "Em andamento"],
    ]);
    expect(cartoes[0].licoes[1].ariaLabel).toBe(
      "Álvaro: Em andamento, 1 de 2 páginas, questionário 40%"
    );
  });
});
