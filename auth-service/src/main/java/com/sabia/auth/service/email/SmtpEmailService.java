package com.sabia.auth.service.email;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@ConditionalOnProperty(name = "sabia.email.provider", havingValue = "smtp")
public class SmtpEmailService implements EmailService {

    private final JavaMailSender mailSender;
    private final String remetente;

    public SmtpEmailService(JavaMailSender mailSender,
                             @Value("${sabia.email.remetente}") String remetente) {
        this.mailSender = mailSender;
        this.remetente = remetente;
    }

    @Override
    public void enviarLinkRecuperacaoSenha(String destinatario, String nome, String link) {
        SimpleMailMessage mensagem = new SimpleMailMessage();
        mensagem.setFrom(remetente);
        mensagem.setTo(destinatario);
        mensagem.setSubject("Sabiá — Recuperação de senha");
        mensagem.setText("""
                Olá, %s!

                Recebemos uma solicitação para redefinir sua senha no Sabiá.
                Acesse o link abaixo para escolher uma nova senha. Ele é válido por 24 horas e só pode ser usado uma vez:

                %s

                Se você não solicitou essa alteração, ignore este e-mail.
                """.formatted(nome, link));

        try {
            mailSender.send(mensagem);
            log.info("E-mail de recuperação de senha enviado para <{}>", destinatario);
        } catch (MailException e) {
            log.error("Falha ao enviar e-mail de recuperação de senha para <{}>", destinatario, e);
        }
    }
}
