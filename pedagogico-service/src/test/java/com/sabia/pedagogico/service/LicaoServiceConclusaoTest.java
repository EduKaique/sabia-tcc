package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.response.ConclusaoAtividadeResponse;
import com.sabia.pedagogico.exception.EstadoPraticaInvalidoException;
import com.sabia.pedagogico.exception.OperacaoInvalidaException;
import com.sabia.pedagogico.model.atividade.ModoAtividade;
import com.sabia.pedagogico.model.licao.Licao;
import com.sabia.pedagogico.model.licao.ProgressoLicao;
import com.sabia.pedagogico.model.licao.StatusLicao;
import com.sabia.pedagogico.repository.LicaoRepository;
import com.sabia.pedagogico.repository.ProgressoLicaoRepository;
import com.sabia.pedagogico.service.pratica.StatusPratica;
import com.sabia.pedagogico.service.pratica.ValidadorPratica;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Conclusão da prática da lição decidida no servidor; uma prática concluída nunca volta atrás. */
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

    private final LicaoRepository licaoRepo = mock(LicaoRepository.class);
    private final ProgressoLicaoRepository progressoRepo = mock(ProgressoLicaoRepository.class);
    private final LicaoService service = new LicaoService(licaoRepo, progressoRepo,
            new ValidadorPratica(new CenarioRoboValidador(JsonMapper.builder().build())));
    private final Licao licao = Licao.builder().id(1L).status(StatusLicao.ATIVA)
            .modo(ModoAtividade.JOGO_ROBO).cenarioJson(CENARIO).build();

    LicaoServiceConclusaoTest() {
        when(licaoRepo.findByIdAndStatus(1L, StatusLicao.ATIVA)).thenReturn(Optional.of(licao));
        when(progressoRepo.findByAlunoIdAndLicaoId(any(), any())).thenReturn(Optional.empty());
        when(progressoRepo.save(any(ProgressoLicao.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void roboQueChegaConcluiAPratica() {
        ConclusaoAtividadeResponse r = service.concluirAtividade(7L, 1L, CHEGA);

        assertThat(r.atividadeConcluida()).isTrue();
        assertThat(r.concluida()).isTrue();
        assertThat(r.concluidaEm()).isNotNull();
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
}
