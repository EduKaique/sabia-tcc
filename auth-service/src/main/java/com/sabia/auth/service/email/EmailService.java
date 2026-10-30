package com.sabia.auth.service.email;

public interface EmailService {

    /**
     * Envia o link de recuperação de senha para o usuário. Implementações reais
     * (SMTP, provedor transacional) substituem {@link DevEmailService} via
     * {@code sabia.email.provider}.
     */
    void enviarLinkRecuperacaoSenha(String destinatario, String nome, String link);

    /**
     * Envia a senha temporária gerada quando o admin cadastra um novo professor
     * (HU001.4 — o professor é obrigado a trocá-la no primeiro login).
     */
    void enviarSenhaTemporaria(String destinatario, String nome, String senhaTemporaria);
}
