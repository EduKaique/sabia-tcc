package com.sabia.pedagogico.service;

import com.sabia.pedagogico.dto.request.CenarioRoboRequest;
import com.sabia.pedagogico.dto.response.CenarioRoboResponse;
import com.sabia.pedagogico.exception.CenarioInvalidoException;
import com.sabia.pedagogico.exception.ConflitoException;
import com.sabia.pedagogico.exception.ResourceNotFoundException;
import com.sabia.pedagogico.model.robo.CenarioRobo;
import com.sabia.pedagogico.repository.CenarioRoboRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Regras da biblioteca de cenários: dono pelo id do token, 404 para outro professor, limite e validação. */
class CenarioRoboServiceTest {

    static final String VALIDO = "{\"versao\":1,\"linhas\":5,\"colunas\":5,"
            + "\"inicio\":{\"linha\":4,\"coluna\":0},\"destino\":{\"linha\":0,\"coluna\":4},"
            + "\"obstaculos\":[],\"blocosPermitidos\":[\"robo_mover\"]}";
    /** Destino (0,0) cercado por (0,1) e (1,0). */
    static final String IMPOSSIVEL = "{\"versao\":1,\"linhas\":3,\"colunas\":3,"
            + "\"inicio\":{\"linha\":2,\"coluna\":2},\"destino\":{\"linha\":0,\"coluna\":0},"
            + "\"obstaculos\":[{\"linha\":0,\"coluna\":1},{\"linha\":1,\"coluna\":0}],"
            + "\"blocosPermitidos\":[\"robo_mover\"]}";

    private static final long PROFESSOR_A = 5L;
    private static final long PROFESSOR_B = 6L;

    private final CenarioRoboRepository repo = mock(CenarioRoboRepository.class);
    private final CenarioRoboService service =
            new CenarioRoboService(repo, new CenarioRoboValidador(JsonMapper.builder().build()));

    private static CenarioRobo cenario(long id, long professorId, String nome) {
        LocalDateTime agora = LocalDateTime.now();
        return CenarioRobo.builder().id(id).professorId(professorId).nome(nome).cenarioJson(VALIDO)
                .criadoEm(agora).atualizadoEm(agora).build();
    }

    CenarioRoboServiceTest() {
        when(repo.save(any(CenarioRobo.class))).thenAnswer(inv -> {
            CenarioRobo c = inv.getArgument(0);
            c.setId(99L);
            return c;
        });
        when(repo.saveAndFlush(any(CenarioRobo.class))).thenAnswer(inv -> inv.getArgument(0));
        when(repo.findByIdAndProfessorId(1L, PROFESSOR_A)).thenReturn(Optional.of(cenario(1L, PROFESSOR_A, "Do A")));
        when(repo.findByIdAndProfessorId(1L, PROFESSOR_B)).thenReturn(Optional.empty());
    }

    @Test
    void criaComODonoDoTokenEONomeAparado() {
        CenarioRoboResponse resp = service.criar(PROFESSOR_A, new CenarioRoboRequest("  Labirinto  ", VALIDO));

        ArgumentCaptor<CenarioRobo> salvo = ArgumentCaptor.forClass(CenarioRobo.class);
        verify(repo).save(salvo.capture());
        assertThat(salvo.getValue().getProfessorId()).isEqualTo(PROFESSOR_A);
        assertThat(salvo.getValue().getNome()).isEqualTo("Labirinto");
        assertThat(salvo.getValue().getCenarioJson()).isEqualTo(VALIDO);
        assertThat(resp.id()).isEqualTo(99L);
    }

    @Test
    void listaSoDoProfessorNaOrdemDoRepositorio() {
        when(repo.findByProfessorIdOrderByAtualizadoEmDesc(PROFESSOR_A))
                .thenReturn(List.of(cenario(2L, PROFESSOR_A, "Mais novo"), cenario(1L, PROFESSOR_A, "Mais antigo")));

        assertThat(service.listarDoProfessor(PROFESSOR_A)).extracting(CenarioRoboResponse::nome)
                .containsExactly("Mais novo", "Mais antigo");
        verify(repo).findByProfessorIdOrderByAtualizadoEmDesc(PROFESSOR_A);
    }

    @Test
    void buscaEditaEExcluiODoProprioProfessor() {
        assertThat(service.buscar(PROFESSOR_A, 1L).nome()).isEqualTo("Do A");

        CenarioRoboResponse editado = service.atualizar(PROFESSOR_A, 1L, new CenarioRoboRequest("Novo nome", VALIDO));
        assertThat(editado.nome()).isEqualTo("Novo nome");

        service.excluir(PROFESSOR_A, 1L);
        verify(repo).delete(any(CenarioRobo.class));
    }

    @Test
    void outroProfessorRecebe404AoVerEditarOuExcluir() {
        assertThatThrownBy(() -> service.buscar(PROFESSOR_B, 1L)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.atualizar(PROFESSOR_B, 1L, new CenarioRoboRequest("Invasor", VALIDO)))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.excluir(PROFESSOR_B, 1L)).isInstanceOf(ResourceNotFoundException.class);

        verify(repo, never()).saveAndFlush(any());
        verify(repo, never()).delete(any(CenarioRobo.class));
    }

    @Test
    void cenarioImpossivelNaoESalvoNaCriacaoNemNaEdicao() {
        assertThatThrownBy(() -> service.criar(PROFESSOR_A, new CenarioRoboRequest("Sem saída", IMPOSSIVEL)))
                .isInstanceOf(CenarioInvalidoException.class)
                .hasMessage("O cenário não tem caminho do início ao destino.");
        assertThatThrownBy(() -> service.atualizar(PROFESSOR_A, 1L, new CenarioRoboRequest("Sem saída", IMPOSSIVEL)))
                .isInstanceOf(CenarioInvalidoException.class)
                .hasMessage("O cenário não tem caminho do início ao destino.");

        verify(repo, never()).save(any());
        verify(repo, never()).saveAndFlush(any());
    }

    @Test
    void quinquagesimoPrimeiroCenarioDevolve409() {
        when(repo.countByProfessorId(PROFESSOR_A)).thenReturn(50L);

        assertThatThrownBy(() -> service.criar(PROFESSOR_A, new CenarioRoboRequest("Mais um", VALIDO)))
                .isInstanceOf(ConflitoException.class)
                .hasMessageContaining("limite de 50 cenários");
        verify(repo, never()).save(any());
    }

    @Test
    void quinquagesimoCenarioAindaEhAceito() {
        when(repo.countByProfessorId(PROFESSOR_A)).thenReturn(49L);

        service.criar(PROFESSOR_A, new CenarioRoboRequest("O último", VALIDO));
        verify(repo).save(any(CenarioRobo.class));
    }

    @Test
    void depoisDeExcluidoOCenarioDevolve404() {
        when(repo.findByIdAndProfessorId(7L, PROFESSOR_A))
                .thenReturn(Optional.of(cenario(7L, PROFESSOR_A, "Temporário")), Optional.empty());

        service.excluir(PROFESSOR_A, 7L);
        assertThatThrownBy(() -> service.buscar(PROFESSOR_A, 7L)).isInstanceOf(ResourceNotFoundException.class);
    }
}
