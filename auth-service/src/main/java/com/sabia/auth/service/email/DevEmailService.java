package com.sabia.auth.service.email;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@ConditionalOnProperty(name = "sabia.email.provider", havingValue = "dev", matchIfMissing = true)
public class DevEmailService implements EmailService {

    @Override
    public void enviarLinkRecuperacaoSenha(String destinatario, String nome, String link) {
        log.info("[DEV] Link de recuperação de senha para {} <{}>: {}", nome, destinatario, link);
    }
}
