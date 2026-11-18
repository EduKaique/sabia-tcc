package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.response.CorrecaoQuestionarioResponse;
import com.sabia.pedagogico.dto.response.PulsoVideoResponse;
import com.sabia.pedagogico.exception.ConteudoInvalidoException;
import com.sabia.pedagogico.exception.OperacaoInvalidaException;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.atividade.ModoAtividade;
import com.sabia.pedagogico.model.licao.Licao;
import com.sabia.pedagogico.model.licao.PaginaLicao;
import com.sabia.pedagogico.model.licao.ProgressoPagina;
import com.sabia.pedagogico.model.licao.StatusLicao;
import com.sabia.pedagogico.model.licao.TipoPagina;
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
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Página vista, pulso do vídeo (relógio manual) e questionário. O repositório de progresso é um fake em memória. */
class ProgressoPaginaServiceTest {

    private static final long ALUNO = 7L;
    private static final String QUESTIONARIO = "{\"percentualMinimo\":70,\"perguntas\":["
            + "{\"enunciado\":\"P1\",\"alternativas\":[\"a\",\"b\",\"c\"],\"correta\":1},"
            + "{\"enunciado\":\"P2\",\"alternativas\":[\"a\",\"b\"],\"correta\":0},"
            + "{\"enunciado\":\"P3\",\"alternativas\":[\"a\",\"b\",\"c\",\"d\"],\"correta\":3}]}";

    private final RelogioManual relogio = new RelogioManual(Instant.parse("2026-11-17T12:00:00Z"));
    private final LicaoRepository licaoRepo = mock(LicaoRepository.class);
    private final PaginaLicaoRepository paginaRepo = mock(PaginaLicaoRepository.class);
    private final ProgressoLicaoRepository progressoRepo = mock(ProgressoLicaoRepository.class);
    private final ProgressoPaginaRepository progressoPaginaRepo = mock(ProgressoPaginaRepository.class);
    private final ConteudoPaginaLeitor leitor = new ConteudoPaginaLeitor(JsonMapper.builder().build());
    private final LicaoService licaoService = new LicaoService(licaoRepo, mock(LicaoTurmaRepository.class), paginaRepo,
            progressoRepo, progressoPaginaRepo, leitor, mock(ValidadorPratica.class), relogio);
    private final ProgressoPaginaService service = new ProgressoPaginaService(licaoService, paginaRepo,
            progressoPaginaRepo, leitor, relogio);

    private final Licao licao = Licao.builder().id(1L).status(StatusLicao.ATIVA).modo(ModoAtividade.BLOCOS)
            .publicadaEm(LocalDateTime.of(2026, 11, 1, 0, 0)).build();
    private final Licao outra = Licao.builder().id(2L).status(StatusLicao.ATIVA).modo(ModoAtividade.BLOCOS).build();
    private final PaginaLicao texto = pagina(10L, licao, 0, TipoPagina.TEXTO, "{\"html\":\"<p>a</p>\"}");
    private final PaginaLicao video = pagina(11L, licao, 1, TipoPagina.VIDEO_YOUTUBE,
            "{\"videoId\":\"dQw4w9WgXcQ\",\"duracaoSegundos\":100}");
    private final PaginaLicao questionario = pagina(12L, licao, 2, TipoPagina.QUESTIONARIO, QUESTIONARIO);
    private final PaginaLicao videoSemDuracao = pagina(13L, licao, 3, TipoPagina.VIDEO_YOUTUBE,
            "{\"videoId\":\"dQw4w9WgXcQ\"}");
    private final PaginaLicao daOutraLicao = pagina(20L, outra, 0, TipoPagina.VIDEO_YOUTUBE,
            "{\"videoId\":\"dQw4w9WgXcQ\",\"duracaoSegundos\":100}");

    /** Linhas de progresso_pagina do fake, por (aluno, página). */
    private final Map<String, ProgressoPagina> linhas = new HashMap<>();

    ProgressoPaginaServiceTest() {
        when(licaoRepo.findVisivelParaAluno(1L, ALUNO)).thenReturn(Optional.of(licao));
        when(licaoRepo.findVisivelParaAluno(2L, ALUNO)).thenReturn(Optional.of(outra));
        when(licaoRepo.findVisivelParaAluno(eq(1L), eq(8L))).thenReturn(Optional.empty());
        for (PaginaLicao p : List.of(texto, video, questionario, videoSemDuracao, daOutraLicao)) {
            when(paginaRepo.findById(p.getId())).thenReturn(Optional.of(p));
        }
        when(paginaRepo.findById(999L)).thenReturn(Optional.empty());
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(1L)).thenReturn(List.of(texto, video, questionario));
        when(progressoRepo.findByAlunoIdAndLicaoId(any(), any())).thenReturn(Optional.empty());

        when(progressoPaginaRepo.criarSeAusente(anyLong(), anyLong())).thenAnswer(inv -> {
            Long aluno = inv.getArgument(0);
            Long paginaId = inv.getArgument(1);
            return linhas.putIfAbsent(aluno + ":" + paginaId, ProgressoPagina.builder().alunoId(aluno)
                    .pagina(paginaRepo.findById(paginaId).orElseThrow()).build()) == null ? 1 : 0;
        });
        when(progressoPaginaRepo.buscarParaAtualizar(anyLong(), anyLong())).thenAnswer(inv ->
                Optional.ofNullable(linhas.get(inv.getArgument(0) + ":" + inv.getArgument(1))));
        when(progressoPaginaRepo.findByAlunoIdAndPaginaIdIn(anyLong(), any())).thenAnswer(inv -> {
            Long aluno = inv.getArgument(0);
            Collection<Long> ids = inv.getArgument(1);
            return ids.stream().map(id -> linhas.get(aluno + ":" + id)).filter(l -> l != null).toList();
        });
    }

    private static PaginaLicao pagina(long id, Licao licao, int ordem, TipoPagina tipo, String json) {
        return PaginaLicao.builder().id(id).licao(licao).ordem(ordem).tipo(tipo).conteudoJson(json).build();
    }

    private ProgressoPagina linha(PaginaLicao p) {
        return linhas.get(ALUNO + ":" + p.getId());
    }

    private PulsoVideoResponse pulso() {
        return service.registrarPulso(ALUNO, 1L, 11L);
    }

    private PulsoVideoResponse pulsoApos(long segundos) {
        relogio.avancarSegundos(segundos);
        return pulso();
    }

    // ---------- vista ----------

    @Test
    void vistaEhIdempotenteEConcluiTexto() {
        var r1 = service.marcarVista(ALUNO, 1L, 10L);
        LocalDateTime primeira = linha(texto).getVistaEm();
        relogio.avancarSegundos(60);
        var r2 = service.marcarVista(ALUNO, 1L, 10L);

        assertThat(r1.concluida()).isTrue();
        assertThat(r2.concluida()).isTrue();
        assertThat(r2.praticaLiberada()).isFalse();
        assertThat(linha(texto).getVistaEm()).isEqualTo(primeira);
    }

    @Test
    void vistaDeVideoOuQuestionarioRegistraMasNaoConclui() {
        assertThat(service.marcarVista(ALUNO, 1L, 11L).concluida()).isFalse();
        assertThat(service.marcarVista(ALUNO, 1L, 12L).concluida()).isFalse();
        assertThat(linha(video).getVistaEm()).isNotNull();
    }

    @Test
    void paginaDeOutraLicaoOuInexistenteOuLicaoInvisivelResponde404() {
        assertThatThrownBy(() -> service.marcarVista(ALUNO, 1L, 20L)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.marcarVista(ALUNO, 1L, 999L)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.marcarVista(8L, 1L, 10L)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.registrarPulso(ALUNO, 1L, 20L)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.registrarPulso(8L, 1L, 11L)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.corrigirQuestionario(ALUNO, 2L, 12L, List.of(1, 0, 3)))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.corrigirQuestionario(8L, 1L, 12L, List.of(1, 0, 3)))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(progressoPaginaRepo, never()).criarSeAusente(anyLong(), anyLong());
    }

    // ---------- pulso ----------

    @Test
    void pulsoCreditaPeloRelogioDoServidorComTetoEJanela() {
        assertThat(pulso().segundosCreditados()).isZero();       // primeiro pulso: 0
        assertThat(pulsoApos(10).segundosCreditados()).isEqualTo(10);
        assertThat(pulsoApos(14).segundosCreditados()).isEqualTo(24);
        assertThat(pulsoApos(20).segundosCreditados()).isEqualTo(39); // teto de 15
        assertThat(pulsoApos(31).segundosCreditados()).isEqualTo(39); // fora da janela: 0
        assertThat(pulsoApos(30).segundosCreditados()).isEqualTo(54); // no limite da janela: teto 15
        assertThat(pulso().segundosNecessarios()).isEqualTo(70);
    }

    @Test
    void pausaERetomadaNaoCreditamOTempoParado() {
        pulso();
        pulsoApos(10);
        relogio.avancarSegundos(600);               // pausa longa
        assertThat(pulso().segundosCreditados()).isEqualTo(10);   // retomada: 0
        assertThat(pulsoApos(10).segundosCreditados()).isEqualTo(20);
    }

    @Test
    void conferidoAoAtingirSetentaPorCentoArredondadoParaCimaENuncaDesfeito() {
        // duração 11 s -> ceil(7,7) = 8 s necessários
        video.setConteudoJson("{\"videoId\":\"dQw4w9WgXcQ\",\"duracaoSegundos\":11}");
        pulso();
        PulsoVideoResponse r7 = pulsoApos(7);
        assertThat(r7.segundosNecessarios()).isEqualTo(8);
        assertThat(r7.conferido()).isFalse();
        PulsoVideoResponse r8 = pulsoApos(1);
        assertThat(r8.conferido()).isTrue();
        LocalDateTime conferidoEm = linha(video).getVideoConferidoEm();
        assertThat(conferidoEm).isNotNull();

        LocalDateTime ultimo = linha(video).getUltimoPulsoEm();
        PulsoVideoResponse depois = pulsoApos(10);   // depois de conferido: nada muda
        assertThat(depois.conferido()).isTrue();
        assertThat(depois.segundosCreditados()).isEqualTo(8);
        assertThat(linha(video).getUltimoPulsoEm()).isEqualTo(ultimo);
        assertThat(linha(video).getVideoConferidoEm()).isEqualTo(conferidoEm);
    }

    @Test
    void creditoNaoPassaDaDuracao() {
        video.setConteudoJson("{\"videoId\":\"dQw4w9WgXcQ\",\"duracaoSegundos\":10}");
        linhas.put(ALUNO + ":11", ProgressoPagina.builder().alunoId(ALUNO).pagina(video).segundosVideo(5)
                .ultimoPulsoEm(LocalDateTime.now(relogio)).build());
        // 5 + 15 passaria de 10; necessários = 7 -> conferido, mas o crédito fica em 10
        PulsoVideoResponse r = pulsoApos(15);
        assertThat(r.segundosCreditados()).isEqualTo(10);
        assertThat(r.conferido()).isTrue();
    }

    @Test
    void doisPulsosNoMesmoInstanteNaoDuplicamOCredito() {
        pulso();
        relogio.avancarSegundos(10);
        assertThat(pulso().segundosCreditados()).isEqualTo(10);
        assertThat(pulso().segundosCreditados()).isEqualTo(10);   // mesma hora: intervalo 0
    }

    @Test
    void pulsoComRelogioVoltandoNaoCreditaNegativo() {
        pulso();
        relogio.avancarSegundos(-5);
        assertThat(pulso().segundosCreditados()).isZero();
    }

    @Test
    void pulsoEmPaginaQueNaoEhVideoOuSemDuracaoResponde422() {
        assertThatThrownBy(() -> service.registrarPulso(ALUNO, 1L, 10L)).isInstanceOf(OperacaoInvalidaException.class);
        assertThatThrownBy(() -> service.registrarPulso(ALUNO, 1L, 12L)).isInstanceOf(OperacaoInvalidaException.class);
        assertThatThrownBy(() -> service.registrarPulso(ALUNO, 1L, 13L)).isInstanceOf(OperacaoInvalidaException.class);
        verify(progressoPaginaRepo, never()).criarSeAusente(anyLong(), anyLong());
    }

    @Test
    void videoUploadEhRecusadoComo422() {
        PaginaLicao upload = pagina(14L, licao, 4, TipoPagina.VIDEO_UPLOAD, "{}");
        when(paginaRepo.findById(14L)).thenReturn(Optional.of(upload));

        assertThatThrownBy(() -> service.marcarVista(ALUNO, 1L, 14L)).isInstanceOf(OperacaoInvalidaException.class);
        assertThatThrownBy(() -> service.registrarPulso(ALUNO, 1L, 14L)).isInstanceOf(OperacaoInvalidaException.class);
        assertThatThrownBy(() -> service.corrigirQuestionario(ALUNO, 1L, 14L, List.of(0)))
                .isInstanceOf(OperacaoInvalidaException.class);
    }

    @Test
    void oProgressoDeUmAlunoNaoMexeNoDeOutro() {
        when(licaoRepo.findVisivelParaAluno(1L, 9L)).thenReturn(Optional.of(licao));
        service.marcarVista(9L, 1L, 10L);

        assertThat(linha(texto)).isNull();
        assertThat(linhas.get("9:10").getVistaEm()).isNotNull();
    }

    // ---------- questionário ----------

    @Test
    void todasCertasAprova() {
        CorrecaoQuestionarioResponse r = service.corrigirQuestionario(ALUNO, 1L, 12L, List.of(1, 0, 3));

        assertThat(r.acertos()).isEqualTo(3);
        assertThat(r.total()).isEqualTo(3);
        assertThat(r.percentual()).isEqualTo(100);
        assertThat(r.aprovado()).isTrue();
        assertThat(r.aprovadoNaPagina()).isTrue();
        assertThat(r.tentativas()).isEqualTo(1);
        assertThat(r.perguntas()).extracting("certa").containsExactly(true, true, true);
    }

    @Test
    void percentualPorDivisaoInteiraEAbaixoDoMinimoNaoAprova() {
        CorrecaoQuestionarioResponse r = service.corrigirQuestionario(ALUNO, 1L, 12L, List.of(1, 0, 0));

        assertThat(r.acertos()).isEqualTo(2);
        assertThat(r.percentual()).isEqualTo(66);
        assertThat(r.aprovado()).isFalse();
        assertThat(r.aprovadoNaPagina()).isFalse();
        assertThat(r.perguntas()).extracting("certa").containsExactly(true, true, false);
        assertThat(linha(questionario).getAprovadoEm()).isNull();
    }

    @Test
    void melhorPercentualPreservadoAprovacaoPermanenteETentativasContadas() {
        service.corrigirQuestionario(ALUNO, 1L, 12L, List.of(1, 0, 0));          // 66
        CorrecaoQuestionarioResponse aprovada = service.corrigirQuestionario(ALUNO, 1L, 12L, List.of(1, 0, 3));
        LocalDateTime aprovadoEm = linha(questionario).getAprovadoEm();
        relogio.avancarSegundos(60);
        CorrecaoQuestionarioResponse pior = service.corrigirQuestionario(ALUNO, 1L, 12L, List.of(0, 1, 0)); // 0

        assertThat(aprovada.aprovado()).isTrue();
        assertThat(pior.percentual()).isZero();
        assertThat(pior.aprovado()).isFalse();
        assertThat(pior.aprovadoNaPagina()).isTrue();
        assertThat(pior.melhorPercentual()).isEqualTo(100);
        assertThat(pior.tentativas()).isEqualTo(3);
        assertThat(linha(questionario).getAprovadoEm()).isEqualTo(aprovadoEm);
    }

    @Test
    void percentualMinimoZeroAprovaMesmoErrandoTudo() {
        questionario.setConteudoJson(QUESTIONARIO.replace("\"percentualMinimo\":70", "\"percentualMinimo\":0"));

        CorrecaoQuestionarioResponse r = service.corrigirQuestionario(ALUNO, 1L, 12L, List.of(0, 1, 0));

        assertThat(r.percentual()).isZero();
        assertThat(r.aprovado()).isTrue();
    }

    @Test
    void respostasDeTamanhoErradoOuIndiceForaDoIntervaloResponde400SemContarTentativa() {
        assertThatThrownBy(() -> service.corrigirQuestionario(ALUNO, 1L, 12L, List.of(1, 0)))
                .isInstanceOf(ConteudoInvalidoException.class)
                .satisfies(e -> assertThat(((ConteudoInvalidoException) e).getCampos()).containsKey("respostas"));
        assertThatThrownBy(() -> service.corrigirQuestionario(ALUNO, 1L, 12L, List.of(1, 0, 3, 0)))
                .isInstanceOf(ConteudoInvalidoException.class);
        assertThatThrownBy(() -> service.corrigirQuestionario(ALUNO, 1L, 12L, List.of(3, 0, 3)))
                .isInstanceOf(ConteudoInvalidoException.class)
                .satisfies(e -> assertThat(((ConteudoInvalidoException) e).getCampos()).containsKey("respostas[0]"));
        assertThatThrownBy(() -> service.corrigirQuestionario(ALUNO, 1L, 12L, List.of(1, -1, 3)))
                .isInstanceOf(ConteudoInvalidoException.class)
                .satisfies(e -> assertThat(((ConteudoInvalidoException) e).getCampos()).containsKey("respostas[1]"));
        assertThat(linha(questionario)).isNull();
    }

    @Test
    void questionarioEmPaginaQueNaoEhQuestionarioResponde422() {
        assertThatThrownBy(() -> service.corrigirQuestionario(ALUNO, 1L, 10L, List.of(0)))
                .isInstanceOf(OperacaoInvalidaException.class);
        assertThatThrownBy(() -> service.corrigirQuestionario(ALUNO, 1L, 11L, List.of(0)))
                .isInstanceOf(OperacaoInvalidaException.class);
    }

    // ---------- prática liberada ----------

    @Test
    void praticaLiberadaQuandoAsTresPaginasSaoConcluidas() {
        video.setConteudoJson("{\"videoId\":\"dQw4w9WgXcQ\",\"duracaoSegundos\":10}");
        assertThat(service.marcarVista(ALUNO, 1L, 10L).praticaLiberada()).isFalse();
        assertThat(service.corrigirQuestionario(ALUNO, 1L, 12L, List.of(1, 0, 3)).praticaLiberada()).isFalse();
        pulso();
        assertThat(pulsoApos(5).praticaLiberada()).isFalse();
        PulsoVideoResponse ultimo = pulsoApos(5);
        assertThat(ultimo.conferido()).isTrue();
        assertThat(ultimo.praticaLiberada()).isTrue();
    }
}
