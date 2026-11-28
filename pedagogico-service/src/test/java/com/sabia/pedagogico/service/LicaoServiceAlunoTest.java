package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.response.ConteudoPaginaAluno;
import com.sabia.pedagogico.dto.response.LicaoDetalheResponse;
import com.sabia.pedagogico.dto.response.LicaoResumoResponse;
import com.sabia.pedagogico.dto.response.TurmaVinculadaResponse;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.atividade.ModoPratica;
import com.sabia.pedagogico.model.licao.EstadoLicaoAluno;
import com.sabia.pedagogico.model.licao.Licao;
import com.sabia.pedagogico.model.licao.LicaoTurma;
import com.sabia.pedagogico.model.licao.PaginaLicao;
import com.sabia.pedagogico.model.licao.ProgressoLicao;
import com.sabia.pedagogico.model.licao.ProgressoPagina;
import com.sabia.pedagogico.model.licao.StatusLicao;
import com.sabia.pedagogico.model.licao.TipoPagina;
import com.sabia.pedagogico.model.turma.Turma;
import com.sabia.pedagogico.repository.LicaoRepository;
import com.sabia.pedagogico.repository.LicaoTurmaRepository;
import com.sabia.pedagogico.repository.PaginaLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoPaginaRepository;
import com.sabia.pedagogico.service.licao.ConteudoPaginaLeitor;
import com.sabia.pedagogico.service.pratica.ValidadorPratica;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.LongStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

/**
 * Listagem e detalhe do aluno: visibilidade pelas consultas de visibilidade (o filtro de status, publicação e
 * matrícula está no JPQL), estados calculados, turmas do aluno e consultas em lote (sem N+1).
 */
class LicaoServiceAlunoTest {

    private static final long ALUNO = 7L;
    private static final LocalDateTime T = LocalDateTime.of(2026, 11, 10, 9, 0);

    private final LicaoRepository licaoRepo = mock(LicaoRepository.class);
    private final LicaoTurmaRepository vinculoRepo = mock(LicaoTurmaRepository.class);
    private final PaginaLicaoRepository paginaRepo = mock(PaginaLicaoRepository.class);
    private final ProgressoLicaoRepository progressoRepo = mock(ProgressoLicaoRepository.class);
    private final ProgressoPaginaRepository progressoPaginaRepo = mock(ProgressoPaginaRepository.class);
    private final LicaoService service = new LicaoService(licaoRepo, vinculoRepo, paginaRepo, progressoRepo,
            progressoPaginaRepo, new ConteudoPaginaLeitor(JsonMapper.builder().build()), mock(ValidadorPratica.class),
            new RelogioManual(Instant.parse("2026-11-17T12:00:00Z")));

    private final Turma turmaA = Turma.builder().id(10L).nome("Turma A").build();
    private final Turma turmaB = Turma.builder().id(11L).nome("Turma B").build();

    private static Licao licao(long id, LocalDateTime publicadaEm) {
        return Licao.builder().id(id).titulo("Lição " + id).conceito("Conceito").resumo("Resumo")
                .modo(ModoPratica.BLOCOS).status(StatusLicao.ATIVA).professorId(2L).publicadaEm(publicadaEm).build();
    }

    private static LicaoTurma vinculo(Licao l, Turma t) {
        return LicaoTurma.builder().licao(l).turma(t).vinculadaEm(T).build();
    }

    private static PaginaLicao pagina(long id, Licao l, int ordem, TipoPagina tipo, String json) {
        return PaginaLicao.builder().id(id).licao(l).ordem(ordem).tipo(tipo).conteudoJson(json).build();
    }

    private static PaginaLicao texto(long id, Licao l, int ordem) {
        return pagina(id, l, ordem, TipoPagina.TEXTO, "{\"html\":\"<p>x</p>\"}");
    }

    // ---------- visibilidade ----------

    @Test
    void listagemUsaSoAConsultaDeVisibilidadeDoAlunoDoToken() {
        when(vinculoRepo.findVisiveisParaAluno(ALUNO)).thenReturn(List.of());

        assertThat(service.listarParaAluno(ALUNO)).isEmpty();
        verify(vinculoRepo).findVisiveisParaAluno(ALUNO);
        verifyNoMoreInteractions(vinculoRepo);
        verifyNoInteractions(licaoRepo, paginaRepo, progressoRepo, progressoPaginaRepo);
    }

    @Test
    void licaoForaDaVisibilidadeResponde404NoDetalhe() {
        // rascunho, arquivada, outra turma, sem vínculo, aluno removido e legada: a consulta não devolve nada
        when(licaoRepo.findVisivelParaAluno(1L, ALUNO)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.buscarParaAluno(ALUNO, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Lição com id 1 não encontrada.");
        verifyNoInteractions(paginaRepo, progressoRepo, progressoPaginaRepo);
    }

    @Test
    void licaoEmDuasTurmasDoAlunoApareceUmaVezComAsDuas() {
        Licao l = licao(1L, T);
        when(vinculoRepo.findVisiveisParaAluno(ALUNO)).thenReturn(List.of(vinculo(l, turmaA), vinculo(l, turmaB)));
        when(paginaRepo.findByLicaoIdIn(anyCollection())).thenReturn(List.of());

        List<LicaoResumoResponse> lista = service.listarParaAluno(ALUNO);

        assertThat(lista).hasSize(1);
        assertThat(lista.get(0).turmas()).containsExactly(
                new TurmaVinculadaResponse(10L, "Turma A"), new TurmaVinculadaResponse(11L, "Turma B"));
    }

    // ---------- estados e contagens ----------

    @Test
    void listagemCalculaOsQuatroEstadosEAsContagensEOrdenaPorPublicacao() {
        Licao naoIniciada = licao(1L, T.minusDays(3));
        Licao emAndamento = licao(2L, T.minusDays(2));
        Licao liberada = licao(3L, T.minusDays(1));
        Licao concluida = licao(4L, T);
        Licao semPaginas = licao(5L, T);   // empate com a 4: id desc
        when(vinculoRepo.findVisiveisParaAluno(ALUNO)).thenReturn(List.of(vinculo(naoIniciada, turmaA),
                vinculo(emAndamento, turmaA), vinculo(liberada, turmaA), vinculo(concluida, turmaA),
                vinculo(semPaginas, turmaA)));
        PaginaLicao p1 = texto(101L, naoIniciada, 0);
        PaginaLicao p2a = texto(201L, emAndamento, 0);
        PaginaLicao p2b = pagina(202L, emAndamento, 1, TipoPagina.QUESTIONARIO, "{}");
        PaginaLicao p3 = texto(301L, liberada, 0);
        PaginaLicao p4 = texto(401L, concluida, 0);
        when(paginaRepo.findByLicaoIdIn(anyCollection())).thenReturn(List.of(p1, p2a, p2b, p3, p4));
        when(progressoPaginaRepo.findByAlunoIdAndPaginaIdIn(anyLong(), anyCollection())).thenReturn(List.of(
                ProgressoPagina.builder().alunoId(ALUNO).pagina(p2a).vistaEm(T).build(),
                ProgressoPagina.builder().alunoId(ALUNO).pagina(p2b).tentativas(1).melhorPercentual(0).build(),
                ProgressoPagina.builder().alunoId(ALUNO).pagina(p3).vistaEm(T).build()));
        when(progressoRepo.findByAlunoIdAndLicaoIdIn(anyLong(), anyCollection())).thenReturn(List.of(
                ProgressoLicao.builder().alunoId(ALUNO).licao(concluida).atividadeConcluida(true).concluidaEm(T).build()));

        List<LicaoResumoResponse> lista = service.listarParaAluno(ALUNO);

        assertThat(lista).extracting(LicaoResumoResponse::id).containsExactly(5L, 4L, 3L, 2L, 1L);
        assertThat(lista).extracting(LicaoResumoResponse::estado).containsExactly(
                EstadoLicaoAluno.PRATICA_LIBERADA, EstadoLicaoAluno.CONCLUIDA, EstadoLicaoAluno.PRATICA_LIBERADA,
                EstadoLicaoAluno.EM_ANDAMENTO, EstadoLicaoAluno.NAO_INICIADA);
        assertThat(lista).extracting(LicaoResumoResponse::totalPaginas).containsExactly(0, 1, 1, 2, 1);
        assertThat(lista).extracting(LicaoResumoResponse::paginasConcluidas).containsExactly(0, 0, 1, 1, 0);
        assertThat(lista.get(1).atividadeConcluida()).isTrue();
        assertThat(lista.get(1).concluidaEm()).isEqualTo(T);
    }

    @Test
    void autosaveSemPaginaConcluidaContaComoEmAndamento() {
        Licao l = licao(1L, T);
        when(vinculoRepo.findVisiveisParaAluno(ALUNO)).thenReturn(List.of(vinculo(l, turmaA)));
        when(paginaRepo.findByLicaoIdIn(anyCollection())).thenReturn(List.of(texto(101L, l, 0)));
        when(progressoRepo.findByAlunoIdAndLicaoIdIn(anyLong(), anyCollection())).thenReturn(List.of(
                ProgressoLicao.builder().alunoId(ALUNO).licao(l).estadoJson("{}").build()));

        assertThat(service.listarParaAluno(ALUNO).get(0).estado()).isEqualTo(EstadoLicaoAluno.EM_ANDAMENTO);
    }

    @Test
    void listagemFazNumeroFixoDeConsultasQualquerQueSejaAQuantidadeDeLicoes() {
        for (int quantidade : new int[]{1, 20}) {
            LicaoTurmaRepository vinculos = mock(LicaoTurmaRepository.class);
            PaginaLicaoRepository paginas = mock(PaginaLicaoRepository.class);
            ProgressoLicaoRepository progressos = mock(ProgressoLicaoRepository.class);
            ProgressoPaginaRepository progressosPagina = mock(ProgressoPaginaRepository.class);
            LicaoRepository licoes = mock(LicaoRepository.class);
            LicaoService s = new LicaoService(licoes, vinculos, paginas, progressos, progressosPagina,
                    new ConteudoPaginaLeitor(JsonMapper.builder().build()), mock(ValidadorPratica.class),
                    new RelogioManual(Instant.now()));
            List<LicaoTurma> vs = new ArrayList<>();
            List<PaginaLicao> ps = new ArrayList<>();
            LongStream.rangeClosed(1, quantidade).forEach(id -> {
                Licao l = licao(id, T);
                vs.add(vinculo(l, turmaA));
                ps.add(texto(id * 100, l, 0));
                ps.add(texto(id * 100 + 1, l, 1));
            });
            when(vinculos.findVisiveisParaAluno(ALUNO)).thenReturn(vs);
            when(paginas.findByLicaoIdIn(anyCollection())).thenReturn(ps);

            assertThat(s.listarParaAluno(ALUNO)).hasSize(quantidade);

            verify(vinculos).findVisiveisParaAluno(ALUNO);
            verify(paginas).findByLicaoIdIn(anyCollection());
            verify(progressosPagina).findByAlunoIdAndPaginaIdIn(any(), anyCollection());
            verify(progressos).findByAlunoIdAndLicaoIdIn(any(), anyCollection());
            verifyNoMoreInteractions(vinculos, paginas, progressos, progressosPagina);
            verifyNoInteractions(licoes);
        }
    }

    // ---------- detalhe ----------

    @Test
    void detalheMontaAsPaginasComConteudoDoAlunoEProgressoPorTipo() {
        Licao l = licao(1L, T);
        l.setCenarioJson(null);
        when(licaoRepo.findVisivelParaAluno(1L, ALUNO)).thenReturn(Optional.of(l));
        PaginaLicao t = texto(101L, l, 0);
        PaginaLicao img = pagina(102L, l, 1, TipoPagina.IMAGEM_TEXTO,
                "{\"imagemUrl\":\"https://x.org/a.png\",\"alt\":\"A\"}");
        PaginaLicao v = pagina(103L, l, 2, TipoPagina.VIDEO_YOUTUBE,
                "{\"videoId\":\"dQw4w9WgXcQ\",\"titulo\":\"T\",\"duracaoSegundos\":100}");
        PaginaLicao q = pagina(104L, l, 3, TipoPagina.QUESTIONARIO, "{\"percentualMinimo\":50,\"perguntas\":["
                + "{\"enunciado\":\"E\",\"alternativas\":[\"x\",\"y\"],\"correta\":1}]}");
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(1L)).thenReturn(List.of(t, img, v, q));
        when(progressoPaginaRepo.findByAlunoIdAndPaginaIdIn(anyLong(), anyCollection())).thenReturn(List.of(
                ProgressoPagina.builder().alunoId(ALUNO).pagina(t).vistaEm(T).build(),
                ProgressoPagina.builder().alunoId(ALUNO).pagina(v).segundosVideo(30).build(),
                ProgressoPagina.builder().alunoId(ALUNO).pagina(q).tentativas(2).melhorPercentual(100).aprovadoEm(T)
                        .build()));
        when(progressoRepo.findByAlunoIdAndLicaoId(ALUNO, 1L)).thenReturn(Optional.of(
                ProgressoLicao.builder().alunoId(ALUNO).licao(l).estadoJson("{\"blocks\":{}}").build()));

        LicaoDetalheResponse d = service.buscarParaAluno(ALUNO, 1L);

        assertThat(d.estado()).isEqualTo(EstadoLicaoAluno.EM_ANDAMENTO);
        assertThat(d.praticaLiberada()).isFalse();
        assertThat(d.estadoJson()).isEqualTo("{\"blocks\":{}}");
        assertThat(d.paginas()).extracting("ordem").containsExactly(0, 1, 2, 3);
        assertThat(d.paginas().get(0).conteudo()).isEqualTo(new ConteudoPaginaAluno.Texto("<p>x</p>"));
        assertThat(d.paginas().get(0).progresso().concluida()).isTrue();
        assertThat(d.paginas().get(1).conteudo())
                .isEqualTo(new ConteudoPaginaAluno.ImagemTexto("https://x.org/a.png", "A", null, null));
        assertThat(d.paginas().get(1).progresso().concluida()).isFalse();
        assertThat(d.paginas().get(2).conteudo())
                .isEqualTo(new ConteudoPaginaAluno.VideoYoutube("dQw4w9WgXcQ", "T", null, 100));
        assertThat(d.paginas().get(2).progresso().video().segundosCreditados()).isEqualTo(30);
        assertThat(d.paginas().get(2).progresso().video().segundosNecessarios()).isEqualTo(70);
        assertThat(d.paginas().get(2).progresso().video().conferido()).isFalse();
        assertThat(d.paginas().get(3).conteudo()).isEqualTo(new ConteudoPaginaAluno.Questionario(50,
                List.of(new ConteudoPaginaAluno.Pergunta("E", List.of("x", "y")))));
        assertThat(d.paginas().get(3).progresso().questionario().aprovado()).isTrue();
        assertThat(d.paginas().get(3).progresso().questionario().tentativas()).isEqualTo(2);
    }

    @Test
    void detalheDeLicaoConcluidaMantemPraticaLiberadaMesmoComPaginaNova() {
        Licao l = licao(1L, T);
        when(licaoRepo.findVisivelParaAluno(1L, ALUNO)).thenReturn(Optional.of(l));
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(1L)).thenReturn(List.of(texto(101L, l, 0)));
        when(progressoRepo.findByAlunoIdAndLicaoId(ALUNO, 1L)).thenReturn(Optional.of(
                ProgressoLicao.builder().alunoId(ALUNO).licao(l).atividadeConcluida(true).concluidaEm(T).build()));

        LicaoDetalheResponse d = service.buscarParaAluno(ALUNO, 1L);

        assertThat(d.estado()).isEqualTo(EstadoLicaoAluno.CONCLUIDA);
        assertThat(d.praticaLiberada()).isTrue();
        assertThat(d.concluidaEm()).isEqualTo(T);
    }
}
