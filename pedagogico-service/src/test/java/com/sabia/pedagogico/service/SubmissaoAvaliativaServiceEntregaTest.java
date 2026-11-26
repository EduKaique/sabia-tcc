package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.request.SubmeterAtividadeRequest;
import com.sabia.pedagogico.exception.EstadoPraticaInvalidoException;
import com.sabia.pedagogico.exception.OperacaoInvalidaException;
import com.sabia.pedagogico.mapper.CorrecaoMapper;
import com.sabia.pedagogico.messaging.SubmissaoEnviadaEvent;
import com.sabia.pedagogico.model.atividade.AtividadeAvaliativa;
import com.sabia.pedagogico.model.atividade.ModoPratica;
import com.sabia.pedagogico.model.atividade.ProjetoAvaliativo;
import com.sabia.pedagogico.model.atividade.StatusAtividade;
import com.sabia.pedagogico.model.atividade.SubmissaoAvaliativa;
import com.sabia.pedagogico.model.turma.Turma;
import com.sabia.pedagogico.repository.AtividadeAvaliativaRepository;
import com.sabia.pedagogico.repository.CorrecaoRepository;
import com.sabia.pedagogico.repository.ProjetoAvaliativoRepository;
import com.sabia.pedagogico.repository.SubmissaoAvaliativaRepository;
import com.sabia.pedagogico.repository.TurmaAlunoRepository;
import com.sabia.pedagogico.service.pratica.ResultadoValidacao;
import com.sabia.pedagogico.service.pratica.StatusPratica;
import com.sabia.pedagogico.service.pratica.ValidadorPratica;
import com.sabia.pedagogico.service.robo.AnaliseRobo;
import com.sabia.pedagogico.service.robo.AnaliseRoboService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Entrega da atividade: o servidor valida a prática e grava o resultado, sem recusar a entrega. */
class SubmissaoAvaliativaServiceEntregaTest {

    private static final String CENARIO = "{\"versao\":1,\"linhas\":5,\"colunas\":5,"
            + "\"inicio\":{\"linha\":4,\"coluna\":0},\"destino\":{\"linha\":0,\"coluna\":4},"
            + "\"obstaculos\":[],\"blocosPermitidos\":[\"robo_mover\",\"robo_repetir\"]}";
    private static final String CHEGA = "{\"blocks\":{\"blocks\":[{\"type\":\"robo_mover\",\"fields\":{\"DIRECAO\":\"CIMA\","
            + "\"CASAS\":4},\"next\":{\"block\":{\"type\":\"robo_mover\",\"fields\":{\"DIRECAO\":\"DIREITA\",\"CASAS\":4}}}}]}}";
    private static final String NAO_CHEGA = "{\"blocks\":{\"blocks\":[{\"type\":\"robo_mover\","
            + "\"fields\":{\"DIRECAO\":\"CIMA\",\"CASAS\":1}}]}}";

    private final ObjectMapper json = JsonMapper.builder().build();
    private final SubmissaoAvaliativaRepository submissaoRepo = mock(SubmissaoAvaliativaRepository.class);
    private final AtividadeAvaliativaRepository atividadeRepo = mock(AtividadeAvaliativaRepository.class);
    private final ProjetoAvaliativoRepository projetoRepo = mock(ProjetoAvaliativoRepository.class);
    private final TurmaAlunoRepository turmaAlunoRepo = mock(TurmaAlunoRepository.class);
    private final ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);
    private final SubmissaoAvaliativaService service = new SubmissaoAvaliativaService(
            submissaoRepo, mock(CorrecaoRepository.class), atividadeRepo, projetoRepo, turmaAlunoRepo,
            mock(CorrecaoMapper.class), eventPublisher,
            new ValidadorPratica(new CenarioRoboValidador(json)), json,
            new AnaliseRoboService(new CenarioRoboValidador(json)));
    private final AtividadeAvaliativa atividade = new AtividadeAvaliativa();

    SubmissaoAvaliativaServiceEntregaTest() {
        Turma turma = new Turma();
        turma.setId(3L);
        turma.setProfessorId(5L);
        atividade.setId(10L);
        atividade.setTurma(turma);
        atividade.setStatus(StatusAtividade.PUBLICADA);
        atividade.setModo(ModoPratica.JOGO_ROBO);
        atividade.setCenarioJson(CENARIO);
        when(atividadeRepo.findById(10L)).thenReturn(Optional.of(atividade));
        when(turmaAlunoRepo.existsByTurmaIdAndAlunoId(3L, 7L)).thenReturn(true);
        when(projetoRepo.save(any(ProjetoAvaliativo.class))).thenAnswer(inv -> inv.getArgument(0));
        when(submissaoRepo.save(any(SubmissaoAvaliativa.class))).thenAnswer(inv -> {
            SubmissaoAvaliativa s = inv.getArgument(0);
            s.setId(99L);
            return s;
        });
    }

    private ResultadoValidacao entregarELerResultado(String estado) {
        service.submeter(7L, "Ana", 10L, new SubmeterAtividadeRequest(estado));
        ArgumentCaptor<SubmissaoAvaliativa> salva = ArgumentCaptor.forClass(SubmissaoAvaliativa.class);
        verify(submissaoRepo).save(salva.capture());
        return json.readValue(salva.getValue().getValidacaoJson(), ResultadoValidacao.class);
    }

    @Test
    void entregaDoRoboQueNaoChegaEhAceitaEGravaOResultado() {
        ResultadoValidacao r = entregarELerResultado(NAO_CHEGA);

        assertThat(r.status()).isEqualTo(StatusPratica.NAO_CHEGOU);
        assertThat(r.concluida()).isFalse();
        assertThat(r.motivo()).isNotBlank();
        verify(projetoRepo).save(any(ProjetoAvaliativo.class));
    }

    @Test
    void entregaDoRoboQueChegaGravaConcluida() {
        ResultadoValidacao r = entregarELerResultado(CHEGA);

        assertThat(r.status()).isEqualTo(StatusPratica.CHEGOU);
        assertThat(r.concluida()).isTrue();
        assertThat(r.posicaoFinal().coluna()).isEqualTo(4);
    }

    @Test
    void entregaDeBlocosLivresGravaOResultado() {
        atividade.setModo(ModoPratica.BLOCOS);
        atividade.setCenarioJson(null);

        ResultadoValidacao r = entregarELerResultado("{\"blocks\":{\"blocks\":[{\"type\":\"text_print\"}]}}");

        assertThat(r.modo()).isEqualTo(ModoPratica.BLOCOS);
        assertThat(r.status()).isEqualTo(StatusPratica.BLOCOS_LIVRES_OK);
    }

    @Test
    void jsonIlegivelNaoGravaNada() {
        assertThatThrownBy(() -> service.submeter(7L, "Ana", 10L, new SubmeterAtividadeRequest("{quebrado")))
                .isInstanceOf(EstadoPraticaInvalidoException.class);

        verify(projetoRepo, never()).save(any());
        verify(submissaoRepo, never()).save(any());
    }

    @Test
    void atividadeDoRoboSemCenarioResponde422SemGravar() {
        atividade.setCenarioJson(null);

        assertThatThrownBy(() -> service.submeter(7L, "Ana", 10L, new SubmeterAtividadeRequest(CHEGA)))
                .isInstanceOf(OperacaoInvalidaException.class)
                .hasMessageContaining("sem cenário");
        verify(submissaoRepo, never()).save(any());
    }

    private SubmissaoAvaliativa submissaoGravada(String validacaoJson) {
        SubmissaoAvaliativa s = new SubmissaoAvaliativa();
        s.setId(50L);
        s.setAtividade(atividade);
        s.setValidacaoJson(validacaoJson);
        when(submissaoRepo.findById(50L)).thenReturn(Optional.of(s));
        return s;
    }

    @Test
    void detalheDoProfessorTrazAValidacaoGravada() {
        ResultadoValidacao gravado = new ValidadorPratica(new CenarioRoboValidador(json)).validar(
                ModoPratica.JOGO_ROBO, CENARIO, CHEGA);
        submissaoGravada(json.writeValueAsString(gravado));

        ResultadoValidacao lido = service.buscarParaProfessor(5L, 50L).validacao();

        assertThat(lido).isEqualTo(gravado);
    }

    @Test
    void detalheDeEntregaAntigaOuIlegivelTemValidacaoNula() {
        submissaoGravada(null);
        assertThat(service.buscarParaProfessor(5L, 50L).validacao()).isNull();

        submissaoGravada("{nao é json");
        assertThat(service.buscarParaProfessor(5L, 50L).validacao()).isNull();
    }

    private void comProjeto(SubmissaoAvaliativa s, String estadoJson) {
        ProjetoAvaliativo projeto = new ProjetoAvaliativo();
        projeto.setEstadoJson(estadoJson);
        s.setProjeto(projeto);
    }

    @Test
    void detalheDoRoboTrazAAnaliseMesmoEmEntregaAntigaSemValidacao() {
        comProjeto(submissaoGravada(null), CHEGA);

        var detalhe = service.buscarParaProfessor(5L, 50L);

        assertThat(detalhe.validacao()).isNull();
        AnaliseRobo analise = detalhe.analiseRobo();
        assertThat(analise).isNotNull();
        assertThat(analise.status()).isEqualTo(StatusPratica.CHEGOU);
        assertThat(analise.pseudocodigo()).isEqualTo("mover CIMA 4\nmover DIREITA 4");
    }

    @Test
    void detalheDeBlocosLivresNaoTemAnalise() {
        atividade.setModo(ModoPratica.BLOCOS);
        atividade.setCenarioJson(null);
        comProjeto(submissaoGravada(null), "{\"blocks\":{\"blocks\":[{\"type\":\"text_print\"}]}}");

        assertThat(service.buscarParaProfessor(5L, 50L).analiseRobo()).isNull();
    }

    @Test
    void detalheComCenarioIlegivelOuEstadoMalformadoTemAnaliseNulaSemErro() {
        comProjeto(submissaoGravada(null), "{quebrado");
        assertThat(service.buscarParaProfessor(5L, 50L).analiseRobo()).isNull();

        atividade.setCenarioJson("{\"versao\":1}");
        comProjeto(submissaoGravada(null), CHEGA);
        assertThat(service.buscarParaProfessor(5L, 50L).analiseRobo()).isNull();
    }

    @Test
    void entregaDoRoboNaoPublicaOEventoDeRevisaoGenerica() {
        entregarELerResultado(CHEGA);

        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void entregaDeBlocosLivresContinuaPublicandoOEvento() {
        atividade.setModo(ModoPratica.BLOCOS);
        atividade.setCenarioJson(null);

        entregarELerResultado("{\"blocks\":{\"blocks\":[{\"type\":\"text_print\"}]}}");

        verify(eventPublisher).publishEvent(any(SubmissaoEnviadaEvent.class));
    }
}
