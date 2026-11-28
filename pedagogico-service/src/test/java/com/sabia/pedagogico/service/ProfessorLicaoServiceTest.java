package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.request.CriarLicaoRequest;
import com.sabia.pedagogico.dto.request.PaginaLicaoRequest;
import com.sabia.pedagogico.dto.request.SalvarLicaoRequest;
import com.sabia.pedagogico.dto.request.VincularTurmasRequest;
import com.sabia.pedagogico.dto.response.LicaoProfessorDetalheResponse;
import com.sabia.pedagogico.dto.response.LicaoProfessorResumoResponse;
import com.sabia.pedagogico.exception.AcessoNegadoException;
import com.sabia.pedagogico.exception.CenarioInvalidoException;
import com.sabia.pedagogico.exception.ConflitoException;
import com.sabia.pedagogico.exception.ConteudoInvalidoException;
import com.sabia.pedagogico.exception.OperacaoInvalidaException;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.atividade.ModoPratica;
import com.sabia.pedagogico.model.licao.EstadoPublicacaoLicao;
import com.sabia.pedagogico.model.licao.Licao;
import com.sabia.pedagogico.model.licao.LicaoTurma;
import com.sabia.pedagogico.model.licao.PaginaLicao;
import com.sabia.pedagogico.model.licao.StatusLicao;
import com.sabia.pedagogico.model.licao.TipoPagina;
import com.sabia.pedagogico.model.turma.Turma;
import com.sabia.pedagogico.repository.LicaoRepository;
import com.sabia.pedagogico.repository.LicaoTurmaRepository;
import com.sabia.pedagogico.repository.PaginaLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoPaginaRepository;
import com.sabia.pedagogico.repository.TurmaRepository;
import com.sabia.pedagogico.service.licao.ValidadorConteudoPagina;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Autoria de lições: dono pelo token, upsert das páginas, vínculo com turmas e regras de publicação. */
class ProfessorLicaoServiceTest {

    private static final long DONO = 5L;
    private static final long OUTRO = 6L;
    private static final String CENARIO = "{\"versao\":1,\"linhas\":5,\"colunas\":5,"
            + "\"inicio\":{\"linha\":4,\"coluna\":0},\"destino\":{\"linha\":0,\"coluna\":4},"
            + "\"obstaculos\":[],\"blocosPermitidos\":[\"robo_mover\"]}";
    private static final String IMPOSSIVEL = "{\"versao\":1,\"linhas\":3,\"colunas\":3,"
            + "\"inicio\":{\"linha\":2,\"coluna\":2},\"destino\":{\"linha\":0,\"coluna\":0},"
            + "\"obstaculos\":[{\"linha\":0,\"coluna\":1},{\"linha\":1,\"coluna\":0}],"
            + "\"blocosPermitidos\":[\"robo_mover\"]}";

    private final JsonMapper mapper = JsonMapper.builder().build();
    private final LicaoRepository licaoRepo = mock(LicaoRepository.class);
    private final PaginaLicaoRepository paginaRepo = mock(PaginaLicaoRepository.class);
    private final LicaoTurmaRepository vinculoRepo = mock(LicaoTurmaRepository.class);
    private final TurmaRepository turmaRepo = mock(TurmaRepository.class);
    private final ProgressoPaginaRepository progressoPaginaRepo = mock(ProgressoPaginaRepository.class);
    private final ProfessorLicaoService service = new ProfessorLicaoService(licaoRepo, paginaRepo, vinculoRepo,
            progressoPaginaRepo, turmaRepo,
            new CenarioRoboValidador(mapper), new ValidadorConteudoPagina(mapper), mapper);

    private final LocalDateTime ontem = LocalDateTime.now().minusDays(1);
    private final Licao licao = Licao.builder().id(1L).titulo("Algoritmos").conceito("Sequência")
            .modo(ModoPratica.BLOCOS).status(StatusLicao.ATIVA).professorId(DONO).criadaEm(ontem).atualizadaEm(ontem)
            .build();
    private final AtomicLong proximoId = new AtomicLong(500);

    ProfessorLicaoServiceTest() {
        when(licaoRepo.findById(1L)).thenReturn(Optional.of(licao));
        when(licaoRepo.findById(99L)).thenReturn(Optional.empty());
        when(licaoRepo.findById(2L)).thenReturn(Optional.of(Licao.builder().id(2L)
                .titulo("Legada").conceito("Sequência").modo(ModoPratica.BLOCOS).status(StatusLicao.ATIVA).build()));
        when(licaoRepo.save(any(Licao.class))).thenAnswer(inv -> {
            Licao l = inv.getArgument(0);
            if (l.getId() == null) l.setId(10L);
            return l;
        });
        when(paginaRepo.saveAll(anyList())).thenAnswer(inv -> {
            List<PaginaLicao> paginas = inv.getArgument(0);
            paginas.forEach(p -> { if (p.getId() == null) p.setId(proximoId.getAndIncrement()); });
            return paginas;
        });
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(any())).thenReturn(List.of());
        when(vinculoRepo.findByLicaoId(any())).thenReturn(List.of());
    }

    // ---------- helpers ----------

    private static Turma turma(long id, long professorId) {
        return Turma.builder().id(id).nome("Turma " + id).professorId(professorId).build();
    }

    private PaginaLicao pagina(long id, int ordem, TipoPagina tipo, String json) {
        return PaginaLicao.builder().id(id).licao(licao).ordem(ordem).tipo(tipo).conteudoJson(json).build();
    }

    private PaginaLicaoRequest texto(Long id, String html) {
        return new PaginaLicaoRequest(id, TipoPagina.TEXTO, null, mapper.createObjectNode().put("html", html));
    }

    private SalvarLicaoRequest salvar(ModoPratica modo, String cenario, List<PaginaLicaoRequest> paginas) {
        return new SalvarLicaoRequest("Algoritmos 2", "Sequência", "Descrição", modo, cenario, paginas);
    }

    private void nadaGravado() {
        verify(licaoRepo, never()).save(any());
        verify(paginaRepo, never()).saveAll(anyList());
        verify(paginaRepo, never()).deleteAll(anyList());
        verify(vinculoRepo, never()).saveAll(anyList());
        verify(vinculoRepo, never()).deleteAll(anyList());
    }

    // ---------- criar ----------

    @Test
    void criarPreencheAsColunasObrigatoriasEAsDatas() {
        LicaoProfessorDetalheResponse r = service.criar(DONO, new CriarLicaoRequest("Laços", "Repetição", null));

        ArgumentCaptor<Licao> captor = ArgumentCaptor.forClass(Licao.class);
        verify(licaoRepo).save(captor.capture());
        Licao salva = captor.getValue();
        assertThat(salva.getTitulo()).isEqualTo("Laços");
        assertThat(salva.getConceito()).isEqualTo("Repetição");
        assertThat(salva.getModo()).isEqualTo(ModoPratica.BLOCOS);
        assertThat(salva.getStatus()).isEqualTo(StatusLicao.ATIVA);
        assertThat(salva.getProfessorId()).isEqualTo(DONO);
        assertThat(salva.getCriadaEm()).isNotNull();
        assertThat(salva.getAtualizadaEm()).isNotNull();
        assertThat(salva.getPublicadaEm()).isNull();
        assertThat(salva.getCenarioJson()).isNull();
        assertThat(r.estado()).isEqualTo(EstadoPublicacaoLicao.RASCUNHO);
        assertThat(r.paginas()).isEmpty();
        assertThat(r.turmaIds()).isEmpty();
    }

    @Test
    void criarAte200Licoes_a201aResponde409() {
        when(licaoRepo.countByProfessorIdAndStatus(DONO, StatusLicao.ATIVA)).thenReturn(199L);
        service.criar(DONO, new CriarLicaoRequest("Laços", "Repetição", null));

        when(licaoRepo.countByProfessorIdAndStatus(DONO, StatusLicao.ATIVA)).thenReturn(200L);
        assertThatThrownBy(() -> service.criar(DONO, new CriarLicaoRequest("Laços", "Repetição", null)))
                .isInstanceOf(ConflitoException.class);
        verify(licaoRepo, times(1)).save(any());
    }

    // ---------- listar ----------

    @Test
    void listarTrazSoAsDoDonoNaOrdemDoRepositorioComTurmasEPaginas() {
        Licao recente = Licao.builder().id(3L).titulo("Recente").conceito("C").modo(ModoPratica.JOGO_ROBO)
                .status(StatusLicao.ATIVA).professorId(DONO).publicadaEm(ontem).atualizadaEm(LocalDateTime.now()).build();
        when(licaoRepo.findByProfessorIdAndStatusOrderByAtualizadaEmDesc(DONO, StatusLicao.ATIVA))
                .thenReturn(List.of(recente, licao));
        when(vinculoRepo.findComTurmaByLicaoIdIn(anyCollection()))
                .thenReturn(List.of(LicaoTurma.builder().licao(recente).turma(turma(10, DONO)).build()));
        List<Object[]> contagem = new ArrayList<>();
        contagem.add(new Object[]{3L, 4L});
        when(paginaRepo.contarPorLicao(anyCollection())).thenReturn(contagem);

        List<LicaoProfessorResumoResponse> lista = service.listar(DONO, null);

        assertThat(lista).extracting(LicaoProfessorResumoResponse::id).containsExactly(3L, 1L);
        assertThat(lista.get(0).estado()).isEqualTo(EstadoPublicacaoLicao.PUBLICADA);
        assertThat(lista.get(0).turmas()).extracting("nome").containsExactly("Turma 10");
        assertThat(lista.get(0).quantidadePaginas()).isEqualTo(4);
        assertThat(lista.get(1).estado()).isEqualTo(EstadoPublicacaoLicao.RASCUNHO);
        assertThat(lista.get(1).turmas()).isEmpty();
        assertThat(lista.get(1).quantidadePaginas()).isZero();
    }

    @Test
    void listarPorTurmaExigeTurmaDoProfessor() {
        when(turmaRepo.findByIdAndProfessorId(10L, DONO)).thenReturn(Optional.of(turma(10, DONO)));
        when(licaoRepo.findDoProfessorPorTurma(DONO, StatusLicao.ATIVA, 10L)).thenReturn(List.of());
        assertThat(service.listar(DONO, 10L)).isEmpty();
        verify(licaoRepo).findDoProfessorPorTurma(DONO, StatusLicao.ATIVA, 10L);

        when(turmaRepo.findByIdAndProfessorId(20L, DONO)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.listar(DONO, 20L)).isInstanceOf(AcessoNegadoException.class);
    }

    // ---------- acesso ----------

    @Test
    void outroProfessorRecebe403EmTodasAsOperacoes() {
        SalvarLicaoRequest req = salvar(ModoPratica.BLOCOS, null, List.of(texto(null, "<p>a</p>")));
        List<Executable> chamadas = List.of(
                () -> service.buscar(OUTRO, 1L),
                () -> service.salvar(OUTRO, 1L, req),
                () -> service.vincularTurmas(OUTRO, 1L, new VincularTurmasRequest(List.of())),
                () -> service.publicar(OUTRO, 1L),
                () -> service.despublicar(OUTRO, 1L),
                () -> service.arquivar(OUTRO, 1L));
        for (Executable chamada : chamadas) {
            assertThrows(AcessoNegadoException.class, chamada);
        }
        nadaGravado();
    }

    @Test
    void licaoLegadaSemDonoResponde403ParaQualquerProfessor() {
        assertThatThrownBy(() -> service.buscar(DONO, 2L)).isInstanceOf(AcessoNegadoException.class);
        assertThatThrownBy(() -> service.arquivar(OUTRO, 2L)).isInstanceOf(AcessoNegadoException.class);
        nadaGravado();
    }

    @Test
    void licaoInexistenteResponde404() {
        assertThatThrownBy(() -> service.buscar(DONO, 99L)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.publicar(DONO, 99L)).isInstanceOf(ResourceNotFoundException.class);
    }

    // ---------- turmas ----------

    @Test
    void turmaDeOutroProfessorRecusaOPedidoInteiroSemGravar() {
        when(turmaRepo.findByIdAndProfessorId(10L, DONO)).thenReturn(Optional.of(turma(10, DONO)));
        when(turmaRepo.findByIdAndProfessorId(20L, DONO)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.vincularTurmas(DONO, 1L, new VincularTurmasRequest(List.of(10L, 20L))))
                .isInstanceOf(AcessoNegadoException.class);
        nadaGravado();
    }

    @Test
    @SuppressWarnings("unchecked")
    void vincularSubstituiOsVinculosIgnorandoDuplicatas() {
        LicaoTurma atual = LicaoTurma.builder().id(1L).licao(licao).turma(turma(10, DONO)).build();
        LicaoTurma outra = LicaoTurma.builder().id(2L).licao(licao).turma(turma(12, DONO)).build();
        when(vinculoRepo.findByLicaoId(1L)).thenReturn(List.of(atual, outra));
        when(turmaRepo.findByIdAndProfessorId(10L, DONO)).thenReturn(Optional.of(turma(10, DONO)));
        when(turmaRepo.findByIdAndProfessorId(11L, DONO)).thenReturn(Optional.of(turma(11, DONO)));

        LicaoProfessorDetalheResponse r = service.vincularTurmas(DONO, 1L, new VincularTurmasRequest(List.of(11L, 10L, 11L)));

        ArgumentCaptor<List<LicaoTurma>> novos = ArgumentCaptor.forClass(List.class);
        verify(vinculoRepo).saveAll(novos.capture());
        assertThat(novos.getValue()).extracting(lt -> lt.getTurma().getId()).containsExactly(11L);
        assertThat(novos.getValue().get(0).getVinculadaEm()).isNotNull();
        verify(vinculoRepo).deleteAll(List.of(outra));
        assertThat(r.turmaIds()).containsExactly(10L, 11L);
    }

    @Test
    void listaVaziaDesvinculaTodas() {
        LicaoTurma atual = LicaoTurma.builder().id(1L).licao(licao).turma(turma(10, DONO)).build();
        when(vinculoRepo.findByLicaoId(1L)).thenReturn(List.of(atual));

        LicaoProfessorDetalheResponse r = service.vincularTurmas(DONO, 1L, new VincularTurmasRequest(List.of()));

        verify(vinculoRepo).deleteAll(List.of(atual));
        verify(vinculoRepo, never()).saveAll(anyList());
        assertThat(r.turmaIds()).isEmpty();
    }

    // ---------- salvar ----------

    @Test
    void salvarApagaOProgressoDasPaginasRemovidasAntesDasPaginas() {
        PaginaLicao p100 = pagina(100, 0, TipoPagina.TEXTO, "{\"html\":\"<p>a</p>\"}");
        PaginaLicao p101 = pagina(101, 1, TipoPagina.TEXTO, "{\"html\":\"<p>b</p>\"}");
        PaginaLicao p102 = pagina(102, 2, TipoPagina.TEXTO, "{\"html\":\"<p>c</p>\"}");
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(1L)).thenReturn(List.of(p100, p101, p102));

        service.salvar(DONO, 1L, salvar(ModoPratica.BLOCOS, null, List.of(texto(101L, "<p>b</p>"))));

        InOrder ordem = inOrder(progressoPaginaRepo, paginaRepo);
        ordem.verify(progressoPaginaRepo).deleteByPaginaIdIn(List.of(100L, 102L));
        ordem.verify(paginaRepo).deleteAll(List.of(p100, p102));
    }

    @Test
    void salvarSemRemocaoNaoMexeNoProgresso() {
        PaginaLicao p100 = pagina(100, 0, TipoPagina.TEXTO, "{\"html\":\"<p>a</p>\"}");
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(1L)).thenReturn(List.of(p100));

        service.salvar(DONO, 1L, salvar(ModoPratica.BLOCOS, null, List.of(texto(100L, "<p>a2</p>"))));

        verify(progressoPaginaRepo, never()).deleteByPaginaIdIn(anyCollection());
    }

    @Test
    void salvarFazUpsertDasPaginasERegravaAOrdem() {
        PaginaLicao p100 = pagina(100, 0, TipoPagina.TEXTO, "{\"html\":\"<p>velha</p>\"}");
        PaginaLicao p101 = pagina(101, 1, TipoPagina.TEXTO, "{\"html\":\"<p>b</p>\"}");
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(1L)).thenReturn(List.of(p100, p101));

        PaginaLicaoRequest video = new PaginaLicaoRequest(null, TipoPagina.VIDEO_YOUTUBE, "Vídeo",
                mapper.createObjectNode().put("videoId", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"));
        LicaoProfessorDetalheResponse r = service.salvar(DONO, 1L,
                salvar(ModoPratica.BLOCOS, null, List.of(texto(101L, "<p>nova</p>"), video)));

        assertThat(p101.getOrdem()).isZero();
        assertThat(p101.getConteudoJson()).contains("nova");
        verify(paginaRepo).deleteAll(List.of(p100));
        assertThat(r.paginas()).extracting("ordem").containsExactly(0, 1);
        assertThat(r.paginas()).extracting("tipo").containsExactly(TipoPagina.TEXTO, TipoPagina.VIDEO_YOUTUBE);
        assertThat(r.paginas().get(0).id()).isEqualTo(101L);
        assertThat(r.paginas().get(1).id()).isNotNull();
        assertThat(r.paginas().get(1).titulo()).isEqualTo("Vídeo");
        assertThat(r.paginas().get(1).conteudo().get("videoId").stringValue()).isEqualTo("dQw4w9WgXcQ");
        assertThat(r.titulo()).isEqualTo("Algoritmos 2");
        assertThat(licao.getAtualizadaEm()).isAfter(ontem);
    }

    @Test
    void paginaDeOutraLicaoOuRepetidaResponde400SemGravar() {
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(1L))
                .thenReturn(List.of(pagina(100, 0, TipoPagina.TEXTO, "{\"html\":\"a\"}")));

        assertThatThrownBy(() -> service.salvar(DONO, 1L, salvar(ModoPratica.BLOCOS, null, List.of(texto(777L, "a")))))
                .isInstanceOfSatisfying(ConteudoInvalidoException.class,
                        e -> assertThat(e.getCampos()).containsKey("paginas[0].id"));
        assertThatThrownBy(() -> service.salvar(DONO, 1L,
                salvar(ModoPratica.BLOCOS, null, List.of(texto(100L, "a"), texto(100L, "b")))))
                .isInstanceOfSatisfying(ConteudoInvalidoException.class,
                        e -> assertThat(e.getCampos()).containsKey("paginas[1].id"));
        nadaGravado();
    }

    @Test
    void conteudoInvalidoJuntaOsErrosDeTodasAsPaginas() {
        PaginaLicaoRequest semAlt = new PaginaLicaoRequest(null, TipoPagina.IMAGEM_TEXTO, null,
                mapper.createObjectNode().put("imagemUrl", "https://exemplo.org/a.png"));
        assertThatThrownBy(() -> service.salvar(DONO, 1L,
                salvar(ModoPratica.BLOCOS, null, List.of(texto(null, ""), semAlt))))
                .isInstanceOfSatisfying(ConteudoInvalidoException.class,
                        e -> assertThat(e.getCampos()).containsOnlyKeys("paginas[0].html", "paginas[1].alt"));
        nadaGravado();
    }

    @Test
    void conteudoAcimaDe256KbResponde400() {
        List<PaginaLicaoRequest> paginas = new ArrayList<>();
        for (int i = 0; i < 14; i++) paginas.add(texto(null, "a".repeat(19_990)));
        assertThatThrownBy(() -> service.salvar(DONO, 1L, salvar(ModoPratica.BLOCOS, null, paginas)))
                .isInstanceOfSatisfying(ConteudoInvalidoException.class,
                        e -> assertThat(e.getCampos()).containsKey("paginas"));
        nadaGravado();

        paginas.subList(13, 14).clear();
        service.salvar(DONO, 1L, salvar(ModoPratica.BLOCOS, null, paginas));
    }

    @Test
    void videoUploadResponde422() {
        PaginaLicaoRequest upload = new PaginaLicaoRequest(null, TipoPagina.VIDEO_UPLOAD, null, mapper.createObjectNode());
        assertThatThrownBy(() -> service.salvar(DONO, 1L, salvar(ModoPratica.BLOCOS, null, List.of(upload))))
                .isInstanceOf(OperacaoInvalidaException.class);
        nadaGravado();
    }

    @Test
    void praticaBlocosIgnoraOCenario_eRoboValidaQuandoHaCenario() {
        service.salvar(DONO, 1L, salvar(ModoPratica.BLOCOS, CENARIO, List.of()));
        assertThat(licao.getCenarioJson()).isNull();

        service.salvar(DONO, 1L, salvar(ModoPratica.JOGO_ROBO, null, List.of()));
        assertThat(licao.getModo()).isEqualTo(ModoPratica.JOGO_ROBO);
        assertThat(licao.getCenarioJson()).isNull();

        service.salvar(DONO, 1L, salvar(ModoPratica.JOGO_ROBO, CENARIO, List.of()));
        assertThat(licao.getCenarioJson()).isEqualTo(CENARIO);

        assertThatThrownBy(() -> service.salvar(DONO, 1L, salvar(ModoPratica.JOGO_ROBO, IMPOSSIVEL, List.of())))
                .isInstanceOf(CenarioInvalidoException.class);
    }

    @Test
    void editarLicaoPublicadaPreservaPublicadaEm() {
        licao.setPublicadaEm(ontem);
        LicaoProfessorDetalheResponse r = service.salvar(DONO, 1L, salvar(ModoPratica.BLOCOS, null, List.of(texto(null, "x"))));
        assertThat(licao.getPublicadaEm()).isEqualTo(ontem);
        assertThat(r.estado()).isEqualTo(EstadoPublicacaoLicao.PUBLICADA);
    }

    // ---------- publicar / despublicar / arquivar ----------

    @Test
    void publicarSemPaginaResponde422() {
        assertThatThrownBy(() -> service.publicar(DONO, 1L)).isInstanceOf(OperacaoInvalidaException.class)
                .hasMessageContaining("ao menos uma página");
        assertThat(licao.getPublicadaEm()).isNull();
    }

    @Test
    void publicarComVideoSemDuracaoResponde422() {
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(1L)).thenReturn(List.of(
                pagina(100, 0, TipoPagina.VIDEO_YOUTUBE, "{\"videoId\":\"dQw4w9WgXcQ\"}")));
        assertThatThrownBy(() -> service.publicar(DONO, 1L)).isInstanceOf(OperacaoInvalidaException.class)
                .hasMessageContaining("duração");
        assertThat(licao.getPublicadaEm()).isNull();
    }

    @Test
    void publicarRoboSemCenarioOuComCenarioImpossivelResponde422() {
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(1L)).thenReturn(List.of(
                pagina(100, 0, TipoPagina.TEXTO, "{\"html\":\"a\"}")));
        licao.setModo(ModoPratica.JOGO_ROBO);
        assertThatThrownBy(() -> service.publicar(DONO, 1L)).isInstanceOf(OperacaoInvalidaException.class);

        licao.setCenarioJson(IMPOSSIVEL);
        assertThatThrownBy(() -> service.publicar(DONO, 1L)).isInstanceOf(OperacaoInvalidaException.class);
        assertThat(licao.getPublicadaEm()).isNull();
        verify(licaoRepo, never()).save(any());

        licao.setCenarioJson(CENARIO);
        assertThat(service.publicar(DONO, 1L).estado()).isEqualTo(EstadoPublicacaoLicao.PUBLICADA);
    }

    @Test
    void publicarComVideoComDuracaoEhIdempotente() {
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(1L)).thenReturn(List.of(
                pagina(100, 0, TipoPagina.VIDEO_YOUTUBE, "{\"videoId\":\"dQw4w9WgXcQ\",\"duracaoSegundos\":60}")));

        LicaoProfessorDetalheResponse r = service.publicar(DONO, 1L);
        LocalDateTime publicadaEm = licao.getPublicadaEm();
        assertThat(r.estado()).isEqualTo(EstadoPublicacaoLicao.PUBLICADA);
        assertThat(publicadaEm).isNotNull();

        service.publicar(DONO, 1L);
        assertThat(licao.getPublicadaEm()).isEqualTo(publicadaEm);
        verify(licaoRepo, times(1)).save(any());
    }

    @Test
    void despublicarVoltaARascunhoSemApagarNada() {
        licao.setPublicadaEm(ontem);
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(1L)).thenReturn(List.of(
                pagina(100, 0, TipoPagina.TEXTO, "{\"html\":\"a\"}")));

        LicaoProfessorDetalheResponse r = service.despublicar(DONO, 1L);

        assertThat(r.estado()).isEqualTo(EstadoPublicacaoLicao.RASCUNHO);
        assertThat(r.paginas()).hasSize(1);
        assertThat(licao.getPublicadaEm()).isNull();
        verify(paginaRepo, never()).deleteAll(anyList());
        verify(vinculoRepo, never()).deleteAll(anyList());
    }

    @Test
    void arquivarEhIdempotenteEBloqueiaAsEscritas() {
        service.arquivar(DONO, 1L);
        assertThat(licao.getStatus()).isEqualTo(StatusLicao.INATIVA);
        service.arquivar(DONO, 1L);
        verify(licaoRepo, times(1)).save(any());

        assertThat(service.buscar(DONO, 1L).estado()).isEqualTo(EstadoPublicacaoLicao.ARQUIVADA);
        SalvarLicaoRequest req = salvar(ModoPratica.BLOCOS, null, List.of());
        for (Executable chamada : List.<Executable>of(
                () -> service.salvar(DONO, 1L, req),
                () -> service.vincularTurmas(DONO, 1L, new VincularTurmasRequest(List.of())),
                () -> service.publicar(DONO, 1L),
                () -> service.despublicar(DONO, 1L))) {
            assertThat(assertThrows(OperacaoInvalidaException.class, chamada)).hasMessage("Lição arquivada.");
        }
    }

    // ---------- gabarito ----------

    @Test
    void detalheDoProfessorTrazOGabarito() {
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(1L)).thenReturn(List.of(pagina(100, 0, TipoPagina.QUESTIONARIO,
                "{\"percentualMinimo\":70,\"perguntas\":[{\"enunciado\":\"?\",\"alternativas\":[\"a\",\"b\"],\"correta\":1}]}")));
        when(vinculoRepo.findByLicaoId(1L)).thenReturn(List.of(
                LicaoTurma.builder().licao(licao).turma(turma(12, DONO)).build(),
                LicaoTurma.builder().licao(licao).turma(turma(10, DONO)).build()));

        LicaoProfessorDetalheResponse r = service.buscar(DONO, 1L);

        assertThat(r.paginas().get(0).conteudo().get("perguntas").get(0).get("correta").intValue()).isEqualTo(1);
        assertThat(r.turmaIds()).containsExactly(10L, 12L);
    }
}
