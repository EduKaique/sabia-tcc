package com.sabia.auth.service.email;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class SmtpEmailServiceTest {

    private final JavaMailSender mailSender = mock(JavaMailSender.class);
    private final SmtpEmailService service = new SmtpEmailService(mailSender, "no-reply@sabia.edu");

    @Test
    void enviarLinkRecuperacaoSenha_montaEEnviaMensagem() {
        service.enviarLinkRecuperacaoSenha("aluno@sabia.edu", "Ana", "http://localhost:3000/recuperar-senha?token=abc");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage mensagem = captor.getValue();
        assertThat(mensagem.getFrom()).isEqualTo("no-reply@sabia.edu");
        assertThat(mensagem.getTo()).containsExactly("aluno@sabia.edu");
        assertThat(mensagem.getText()).contains("Ana", "http://localhost:3000/recuperar-senha?token=abc");
    }

    @Test
    void enviarLinkRecuperacaoSenha_naoPropagaExcecaoQuandoEnvioFalha() {
        doThrow(new MailSendException("indisponível")).when(mailSender).send(any(SimpleMailMessage.class));

        service.enviarLinkRecuperacaoSenha("aluno@sabia.edu", "Ana", "http://localhost:3000/recuperar-senha?token=abc");

        verify(mailSender).send(any(SimpleMailMessage.class));
    }
}
