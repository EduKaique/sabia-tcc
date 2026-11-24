package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.response.ConclusaoAtividadeResponse;
import com.sabia.pedagogico.exception.EstadoPraticaInvalidoException;
import com.sabia.pedagogico.exception.OperacaoInvalidaException;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.atividade.ModoAtividade;
import com.sabia.pedagogico.model.licao.Licao;
import com.sabia.pedagogico.model.licao.PaginaLicao;
import com.sabia.pedagogico.model.licao.ProgressoLicao;
import com.sabia.pedagogico.model.licao.ProgressoPagina;
import com.sabia.pedagogico.model.licao.StatusLicao;
import com.sabia.pedagogico.model.licao.TipoPagina;
import com.sabia.pedagogico.repository.LicaoRepository;
import com.sabia.pedagogico.repository.LicaoTurmaRepository;
import com.sabia.pedagogico.repository.PaginaLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoLicaoRepository;
import com.sabia.pedagogico.repository.ProgressoPaginaRepository;
import com.sabia.pedagogico.service.licao.ConteudoPaginaLeitor;
import com.sabia.pedagogico.service.pratica.StatusPratica;
import com.sabia.pedagogico.service.pratica.ValidadorPratica;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Conclusão da prática da lição decidida no servidor; uma prática concluída nunca volta atrás. Desde a L2, a
 * prática exige o conteúdo concluído enquanto a lição não foi concluída.
 */
class LicaoServiceConclusaoTest {

    private static final String CENARIO = "{\"versao\":1,\"linhas\":5,\"colunas\":5,"
            + "\"inicio\":{\"linha\":4,\"coluna\":0},\"destino\":{\"linha\":0,\"coluna\":4},"
            + "\"obstaculos\":[],\"blocosPermitidos\":[\"robo_mover\",\"robo_repetir\"],\"maxBlocos\":2}";
    private static final String CHEGA = "{\"blocks\":{\"blocks\":[{\"type\":\"robo_mover\",\"fields\":{\"DIRECAO\":\"CIMA\","
            + "\"CASAS\":4},\"next\":{\"block\":{\"type\":\"robo_mover\",\"fields\":{\"DIRECAO\":\"DIREITA\",\"CASAS\":4}}}}]}}";
    private static final String NAO_CHEGA = "{\"blocks\":{\"blocks\":[{\"type\":\"robo_mover\","
            + "\"fields\":{\"DIRECAO\":\"CIMA\",\"CASAS\":1}}]}}";
    /** Chega, mas com 3 blocos (CIMA 2 + CIMA 2 + DIREITA 4) e o limite é 2. */
    private static final String CHEGA_COM_BLOCOS_DEMAIS = "{\"blocks\":{\"blocks\":[{\"type\":\"robo_mover\","
            + "\"fields\":{\"DIRECAO\":\"CIMA\",\"CASAS\":2},\"next\":{\"block\":{\"type\":\"robo_mover\","
            + "\"fields\":{\"DIRECAO\":\"CIMA\",\"CASAS\":2},\"next\":{\"block\":{\"type\":\"robo_mover\","
            + "\"fields\":{\"DIRECAO\":\"DIREITA\",\"CASAS\":4}}}}}}]}}";
    private static final LocalDateTime AGORA = LocalDateTime.of(2026, 11, 17, 12, 0);

    private final LicaoRepository licaoRepo = mock(LicaoRepository.class);
    private final PaginaLicaoRepository paginaRepo = mock(PaginaLicaoRepository.class);
    private final ProgressoLicaoRepository progressoRepo = mock(ProgressoLicaoRepository.class);
    private final ProgressoPaginaRepository progressoPaginaRepo = mock(ProgressoPaginaRepository.class);
    private final LicaoService service = new LicaoService(licaoRepo, mock(LicaoTurmaRepository.class), paginaRepo,
            progressoRepo, progressoPaginaRepo, new ConteudoPaginaLeitor(JsonMapper.builder().build()),
            new ValidadorPratica(new CenarioRoboValidador(JsonMapper.builder().build())),
            Clock.fixed(AGORA.toInstant(ZoneOffset.UTC), ZoneOffset.UTC));
    private final Licao licao = Licao.builder().id(1L).status(StatusLicao.ATIVA)
            .modo(ModoAtividade.JOGO_ROBO).cenarioJson(CENARIO).build();
    private final PaginaLicao texto = PaginaLicao.builder().id(10L).licao(licao).ordem(0).tipo(TipoPagina.TEXTO)
            .conteudoJson("{\"html\":\"<p>a</p>\"}").build();

    LicaoServiceConclusaoTest() {
        when(licaoRepo.findVisivelParaAluno(eq(1L), any())).thenReturn(Optional.of(licao));
        when(progressoRepo.findByAlunoIdAndLicaoId(any(), any())).thenReturn(Optional.empty());
        when(progressoRepo.save(any(ProgressoLicao.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void roboQueChegaConcluiAPratica() {
        ConclusaoAtividadeResponse r = service.concluirAtividade(7L, 1L, CHEGA);

        assertThat(r.atividadeConcluida()).isTrue();
        assertThat(r.concluida()).isTrue();
        assertThat(r.concluidaEm()).isEqualTo(AGORA);
        assertThat(r.validacao().status()).isEqualTo(StatusPratica.CHEGOU);
    }

    @Test
    void roboQueNaoChegaOuPassaDoLimiteNaoConcluiENaoEhErro() {
        ConclusaoAtividadeResponse naoChega = service.concluirAtividade(7L, 1L, NAO_CHEGA);
        assertThat(naoChega.atividadeConcluida()).isFalse();
        assertThat(naoChega.validacao().motivo()).isNotBlank();

        ConclusaoAtividadeResponse limite = service.concluirAtividade(7L, 1L, CHEGA_COM_BLOCOS_DEMAIS);
        assertThat(limite.atividadeConcluida()).isFalse();
        assertThat(limite.validacao().status()).isEqualTo(StatusPratica.CHEGOU);
        assertThat(limite.validacao().excedeuLimiteBlocos()).isTrue();
    }

    @Test
    void depoisDeConcluidaUmaTentativaErradaNaoDesfaz() {
        LocalDateTime quando = LocalDateTime.of(2026, 11, 1, 10, 0);
        ProgressoLicao progresso = ProgressoLicao.builder().alunoId(7L).licao(licao)
                .atividadeConcluida(true).concluidaEm(quando).build();
        when(progressoRepo.findByAlunoIdAndLicaoId(7L, 1L)).thenReturn(Optional.of(progresso));

        ConclusaoAtividadeResponse r = service.concluirAtividade(7L, 1L, NAO_CHEGA);

        assertThat(r.validacao().concluida()).isFalse();
        assertThat(r.atividadeConcluida()).isTrue();
        assertThat(r.concluidaEm()).isEqualTo(quando);
        assertThat(progresso.getEstadoJson()).isEqualTo(NAO_CHEGA);
    }

    @Test
    void blocosLivresConcluiComComandoENaoSoComValores() {
        licao.setModo(ModoAtividade.BLOCOS);
        licao.setCenarioJson(null);

        assertThat(service.concluirAtividade(7L, 1L,
                "{\"blocks\":{\"blocks\":[{\"type\":\"math_number\"}]}}").atividadeConcluida()).isFalse();
        assertThat(service.concluirAtividade(7L, 1L,
                "{\"blocks\":{\"blocks\":[{\"type\":\"text_print\"}]}}").atividadeConcluida()).isTrue();
    }

    @Test
    void licaoDoRoboSemCenarioResponde422() {
        licao.setCenarioJson(null);

        assertThatThrownBy(() -> service.concluirAtividade(7L, 1L, CHEGA))
                .isInstanceOf(OperacaoInvalidaException.class);
        verify(progressoRepo, never()).save(any());
    }

    @Test
    void projetoIlegivelNaoGravaNada() {
        assertThatThrownBy(() -> service.concluirAtividade(7L, 1L, "{quebrado"))
                .isInstanceOf(EstadoPraticaInvalidoException.class);
        verify(progressoRepo, never()).save(any());
    }

    // ---------- bloqueio da prática pelo conteúdo (L2) ----------

    @Test
    void comPaginaPendenteResponde422SemGravar() {
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(1L)).thenReturn(List.of(texto));

        assertThatThrownBy(() -> service.concluirAtividade(7L, 1L, CHEGA))
                .isInstanceOf(OperacaoInvalidaException.class)
                .hasMessage("Conclua o conteúdo da lição antes da prática.");
        verify(progressoRepo, never()).save(any());
    }

    @Test
    void comTodasAsPaginasConcluidasSegueAValidacaoDaPratica() {
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(1L)).thenReturn(List.of(texto));
        when(progressoPaginaRepo.findByAlunoIdAndPaginaIdIn(7L, List.of(10L))).thenReturn(List.of(
                ProgressoPagina.builder().alunoId(7L).pagina(texto).vistaEm(AGORA).build()));

        assertThat(service.concluirAtividade(7L, 1L, NAO_CHEGA).atividadeConcluida()).isFalse();
        ConclusaoAtividadeResponse r = service.concluirAtividade(7L, 1L, CHEGA);
        assertThat(r.atividadeConcluida()).isTrue();
        assertThat(r.concluidaEm()).isEqualTo(AGORA);
    }

    @Test
    void licaoSemPaginasLiberaAPraticaDireto() {
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(1L)).thenReturn(List.of());

        assertThat(service.concluirAtividade(7L, 1L, CHEGA).concluida()).isTrue();
    }

    @Test
    void depoisDeConcluidaRefazerComPaginaNovaPendenteNaoDa422ENemDesfaz() {
        LocalDateTime quando = LocalDateTime.of(2026, 11, 1, 10, 0);
        ProgressoLicao progresso = ProgressoLicao.builder().alunoId(7L).licao(licao)
                .atividadeConcluida(true).concluidaEm(quando).build();
        when(progressoRepo.findByAlunoIdAndLicaoId(7L, 1L)).thenReturn(Optional.of(progresso));
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(1L)).thenReturn(List.of(texto));

        ConclusaoAtividadeResponse r = service.concluirAtividade(7L, 1L, CHEGA);

        assertThat(r.validacao().concluida()).isTrue();
        assertThat(r.concluidaEm()).isEqualTo(quando);
    }

    @Test
    void atividadeJaConcluidaSemConclusaoGravaConcluidaEmUmaVez() {
        // Prática concluída pela regra antiga (vídeo legado pendente): basta o conteúdo novo estar completo.
        ProgressoLicao progresso = ProgressoLicao.builder().alunoId(7L).licao(licao).atividadeConcluida(true).build();
        when(progressoRepo.findByAlunoIdAndLicaoId(7L, 1L)).thenReturn(Optional.of(progresso));

        ConclusaoAtividadeResponse r = service.concluirAtividade(7L, 1L, NAO_CHEGA);

        assertThat(r.atividadeConcluida()).isTrue();
        assertThat(r.concluidaEm()).isEqualTo(AGORA);
    }

    @Test
    void autosaveFuncionaComPaginasPendentes() {
        when(paginaRepo.findByLicaoIdOrderByOrdemAsc(1L)).thenReturn(List.of(texto));

        var r = service.salvarEstado(7L, 1L, NAO_CHEGA);

        assertThat(r.concluida()).isFalse();
        verify(progressoRepo).save(argThat(p -> NAO_CHEGA.equals(p.getEstadoJson()) && p.getAlunoId() == 7L));
    }

    @Test
    void licaoInvisivelResponde404NaPraticaNoAutosaveENoDetalhe() {
        when(licaoRepo.findVisivelParaAluno(1L, 8L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.concluirAtividade(8L, 1L, CHEGA)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.salvarEstado(8L, 1L, CHEGA)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.buscarParaAluno(8L, 1L)).isInstanceOf(ResourceNotFoundException.class);
        verify(progressoRepo, never()).save(any());
    }
}
