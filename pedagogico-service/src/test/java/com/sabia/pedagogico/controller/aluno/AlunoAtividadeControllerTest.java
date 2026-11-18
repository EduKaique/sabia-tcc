package com.sabia.pedagogico.controller.aluno;

import com.sabia.pedagogico.dto.response.ProjetoEntregueResponse;
import com.sabia.pedagogico.security.AuthenticatedUser;
import com.sabia.pedagogico.service.AtividadeAvaliativaService;
import com.sabia.pedagogico.service.SubmissaoAvaliativaService;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AlunoAtividadeControllerTest {

    private final AtividadeAvaliativaService service = mock(AtividadeAvaliativaService.class);
    private final AlunoAtividadeController controller =
            new AlunoAtividadeController(service, mock(SubmissaoAvaliativaService.class));

    @Test
    void projetoUsaOAlunoDoToken() {
        var auth = new UsernamePasswordAuthenticationToken(
                new AuthenticatedUser(7L, "ALUNO", "Aluno"), null, List.of());
        var esperado = new ProjetoEntregueResponse("{}", null);
        when(service.buscarProjetoDoAluno(7L, 1L)).thenReturn(esperado);

        var resposta = controller.projeto(auth, 1L);

        assertThat(resposta.getStatusCode().value()).isEqualTo(200);
        assertThat(resposta.getBody()).isSameAs(esperado);
        verify(service).buscarProjetoDoAluno(7L, 1L);
    }
}
