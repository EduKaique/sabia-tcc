package com.sabia.auth.service.email;

public interface EmailService {

    /**
     * Envia o link de recuperação de senha para o usuário. Implementações reais
     * (SMTP, provedor transacional) substituem {@link DevEmailService} via
     * {@code sabia.email.provider}.
     */
    void enviarLinkRecuperacaoSenha(String destinatario, String nome, String link);
}
