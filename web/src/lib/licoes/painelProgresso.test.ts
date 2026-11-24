import { describe, expect, it } from "vitest";
import type { ProgressoLicaoProfessor } from "@/types/licaoProfessor";
import {
  ESTADOS_PAINEL,
  ariaLabelCelula,
  classeEstado,
  iconeEstado,
  montarRelatorioLicao,
  resumoColuna,
  rotuloEstado,
  textoEstadoCelula,
  textoPaginaAluno,
  textoPaginas,
  textoQuestionario,
} from "./painelProgresso";

// Meio-dia UTC: a data é a mesma em qualquer fuso do Brasil (o formatador usa o fuso local).
const CONCLUIDA_EM = "2026-11-12T12:00:00";

const resposta = (): ProgressoLicaoProfessor => ({
  licao: {
    id: 1,
    titulo: "Laços",
    conceito: "Repetição",
    modo: "BLOCOS",
    estado: "PUBLICADA",
    publicadaEm: "2026-11-01T10:00:00",
  },
  paginas: [
    { id: 11, ordem: 0, tipo: "TEXTO", titulo: "O que é um laço" },
    { id: 12, ordem: 1, tipo: "VIDEO_YOUTUBE", titulo: null },
    { id: 13, ordem: 2, tipo: "QUESTIONARIO", titulo: "Confira" },
  ],
  totalAlunos: 3,
  concluiram: 1,
  turmas: [
    {
      turmaId: 10,
      turmaNome: "5º A",
      alunos: [
        {
          alunoId: 8,
          nome: "Álvaro",
          estado: "CONCLUIDA",
          paginasConcluidas: 3,
          melhorPercentualQuestionario: 100,
          atividadeConcluida: true,
          concluidaEm: CONCLUIDA_EM,
          paginas: [
            { paginaId: 11, concluida: true, melhorPercentual: null, tentativas: null },
            { paginaId: 12, concluida: true, melhorPercentual: null, tentativas: null },
            { paginaId: 13, concluida: true, melhorPercentual: 100, tentativas: 1 },
          ],
        },
        {
          alunoId: 2,
          nome: "Bruno",
          estado: "EM_ANDAMENTO",
          paginasConcluidas: 1,
          melhorPercentualQuestionario: 50,
          atividadeConcluida: false,
          concluidaEm: null,
          // Fora de ordem de propósito: o modelo casa pelo id.
          paginas: [
            { paginaId: 13, concluida: false, melhorPercentual: 50, tentativas: 2 },
            { paginaId: 11, concluida: true, melhorPercentual: null, tentativas: null },
            { paginaId: 12, concluida: false, melhorPercentual: null, tentativas: null },
          ],
        },
      ],
    },
    {
      turmaId: 11,
      turmaNome: "5º B",
      alunos: [
        {
          alunoId: 5,
          nome: "Carla",
          estado: "NAO_INICIADA",
          paginasConcluidas: 0,
          melhorPercentualQuestionario: null,
          atividadeConcluida: false,
          concluidaEm: null,
          paginas: [],
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
    const base = { concluidaEm: null };
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
          concluidaEm: CONCLUIDA_EM,
        },
        4
      )
    ).toBe("Ana: Concluída em 12/11/2026, 4 de 4 páginas, questionário 100%");
  });

  it("resumos", () => {
    expect(resumoColuna(3, 12)).toBe("3 de 12 concluíram");
  });
});

describe("modelo da tela Ver lição", () => {
  it("situação de uma página: concluída ou pendente; questionário com % e tentativas ou 'Não tentou'", () => {
    expect(textoPaginaAluno("TEXTO", { paginaId: 1, concluida: true, melhorPercentual: null, tentativas: null })).toEqual({
      concluida: true,
      texto: "Concluída",
      detalhe: null,
    });
    expect(textoPaginaAluno("VIDEO_YOUTUBE", undefined)).toEqual({ concluida: false, texto: "Pendente", detalhe: null });
    expect(
      textoPaginaAluno("QUESTIONARIO", { paginaId: 1, concluida: false, melhorPercentual: 50, tentativas: 2 }).detalhe
    ).toBe("50% · 2 tentativas");
    expect(
      textoPaginaAluno("QUESTIONARIO", { paginaId: 1, concluida: true, melhorPercentual: 100, tentativas: 1 }).detalhe
    ).toBe("100% · 1 tentativa");
    expect(textoPaginaAluno("QUESTIONARIO", undefined).detalhe).toBe("Não tentou");
  });

  it("colunas por página na ordem, com número e tipo", () => {
    const r = montarRelatorioLicao(resposta());
    expect(r.colunas.map((c) => c.rotulo)).toEqual(["1 · Texto", "2 · Vídeo", "3 · Questionário"]);
    expect(r.colunas.map((c) => c.titulo)).toEqual(["O que é um laço", null, "Confira"]);
    expect(r.resumo).toBe("1 de 3 concluíram");
  });

  it("grupos e alunos na ordem do servidor, resumo e células casadas pelo id da página", () => {
    const r = montarRelatorioLicao(resposta());
    expect(r.grupos.map((g) => g.turmaNome)).toEqual(["5º A", "5º B"]);
    expect(r.grupos[0].alunos.map((a) => a.nome)).toEqual(["Álvaro", "Bruno"]);

    const alvaro = r.grupos[0].alunos[0];
    expect(alvaro.textoEstado).toBe("Concluída em 12/11/2026");
    expect(alvaro.paginas).toBe("3/3 páginas");
    expect(alvaro.pratica).toBe("Prática concluída");
    expect(alvaro.icone).toBe("check");

    const bruno = r.grupos[0].alunos[1];
    expect(bruno.celulas.map((c) => c.paginaId)).toEqual([11, 12, 13]);
    expect(bruno.celulas.map((c) => c.texto)).toEqual(["Concluída", "Pendente", "Pendente"]);
    expect(bruno.celulas[2].detalhe).toBe("50% · 2 tentativas");
    expect(bruno.celulas[2].ariaLabel).toBe("Bruno, página 3 (Questionário): Pendente, 50% · 2 tentativas");
    expect(bruno.ariaLabel).toBe("Bruno: Em andamento, 1 de 3 páginas, questionário 50%");
    expect(bruno.pratica).toBe("Prática pendente");
  });

  it("aluno sem progresso: todas as páginas pendentes e o questionário 'Não tentou'", () => {
    const carla = montarRelatorioLicao(resposta()).grupos[1].alunos[0];
    expect(carla.celulas.map((c) => c.texto)).toEqual(["Pendente", "Pendente", "Pendente"]);
    expect(carla.celulas[2].detalhe).toBe("Não tentou");
    expect(carla.textoEstado).toBe("Não iniciada");
    expect(carla.questionario).toBeNull();
  });
});
