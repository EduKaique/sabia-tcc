package com.sabia.auth.messaging;

import com.sabia.auth.messaging.contrato.Eventos;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class PerfilEventosPublisherTest {

    @Test
    void traduzEventoInternoParaContratoDeIntegracao() {
        var publisher = mock(EventoPublisher.class);

        new PerfilEventosPublisher(publisher).aposCommit(new PerfilAlunoAtualizadoEvent(5L, "Ana Souza"));

        var payload = ArgumentCaptor.forClass(Object.class);
        verify(publisher).publicar(eq("aluno.perfil-atualizado"), payload.capture());
        assertThat(payload.getValue()).isEqualTo(new Eventos.AlunoPerfilAtualizado(5L, "Ana Souza"));
    }
}
