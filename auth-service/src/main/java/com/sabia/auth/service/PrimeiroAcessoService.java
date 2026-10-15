package com.sabia.auth.service;

import com.sabia.auth.client.PedagogicoClient;
import com.sabia.auth.client.PedagogicoClient.TurmaConvite;
import com.sabia.auth.dto.request.PrimeiroAcessoRequest;
import com.sabia.auth.dto.response.LoginResponse;
import com.sabia.auth.dto.response.PrimeiroAcessoResponse;
import com.sabia.auth.exception.CadastroDuplicadoException;
import com.sabia.auth.exception.CampoInvalidoException;
import com.sabia.auth.exception.CodigoTurmaInvalidoException;
import com.sabia.auth.exception.SenhaDivergenteException;
import com.sabia.auth.model.usuario.Aluno;
import com.sabia.auth.model.usuario.AvatarCatalogo;
import com.sabia.auth.model.usuario.PerfilUsuario;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.repository.AlunoRepository;
import com.sabia.auth.repository.UsuarioRepository;
import com.sabia.auth.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDate;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Primeiro acesso do aluno pelo convite (HU003.2): cria usuário + aluno e vincula à turma
 * numa única operação. A matrícula remota acontece depois do flush local; se ela falhar,
 * a exceção dá rollback e nenhuma conta fica criada.
 * Nunca logar e-mail, matrícula, data de nascimento nem o corpo do request — só ids.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PrimeiroAcessoService {

    private static final Pattern FORMATO_CODIGO = Pattern.compile("^[A-Z0-9]{6}$");
    private static final int IDADE_MAXIMA_ANOS = 120;

    private final UsuarioRepository usuarioRepository;
    private final AlunoRepository alunoRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final PedagogicoClient pedagogicoClient;

    @Transactional
    public PrimeiroAcessoResponse cadastrar(PrimeiroAcessoRequest request) {
        validarRegrasLocais(request);

        // 1. Código revalidado no servidor; formato inválido nem chega ao pedagogico.
        if (!FORMATO_CODIGO.matcher(request.codigoTurma()).matches()) {
            throw new CodigoTurmaInvalidoException();
        }
        TurmaConvite turma = pedagogicoClient.buscarTurmaPorCodigo(request.codigoTurma());

        // 2. Duplicidade (e-mail sem diferenciar maiúsculas).
        if (usuarioRepository.existsByEmailIgnoreCase(request.email())) {
            throw CadastroDuplicadoException.email();
        }
        if (alunoRepository.existsByMatricula(request.matricula())) {
            throw CadastroDuplicadoException.matricula();
        }

        // 3. Grava e faz flush ANTES da chamada remota, para as constraints UNIQUE dispararem antes.
        Usuario usuario;
        try {
            usuario = usuarioRepository.saveAndFlush(Usuario.builder()
                    .nome(request.nomeCompleto())
                    .email(request.email())
                    .senhaHash(passwordEncoder.encode(request.senha()))
                    .tipoPerfil(PerfilUsuario.ALUNO)
                    .dataNascimento(request.dataNascimento())
                    .build());
            alunoRepository.saveAndFlush(Aluno.builder()
                    .usuario(usuario)
                    .matricula(request.matricula())
                    .avatar(request.avatar())
                    .perfilCompleto(true)
                    .pontuacaoGeral(0)
                    .build());
        } catch (DataIntegrityViolationException e) {
            // Corrida entre dois cadastros simultâneos com o mesmo e-mail ou matrícula.
            throw conflitoDe(e);
        }

        // 4. Vínculo remoto. Se falhar, a exceção desfaz o passo 3.
        try {
            pedagogicoClient.matricular(turma.turmaId(), usuario.getId(), usuario.getNome());
        } catch (RuntimeException e) {
            // Um timeout de leitura pode ter gravado o vínculo no pedagogico: possível órfão.
            log.warn("Primeiro acesso desfeito: matrícula remota falhou ou ficou incerta "
                    + "(turma id={}, aluno id={})", turma.turmaId(), usuario.getId());
            throw e;
        }
        avisarSeCommitFalhar(turma.turmaId(), usuario.getId());

        // 5. Sessão já aberta: mesmo token do login.
        String token = jwtTokenProvider.generateToken(usuario);
        log.info("Primeiro acesso concluído: aluno id={} vinculado à turma id={}", usuario.getId(), turma.turmaId());
        return PrimeiroAcessoResponse.of(
                new LoginResponse(token, "Bearer", PerfilUsuario.ALUNO.name(), usuario.getNome(), false),
                turma.turmaNome());
    }

    private void validarRegrasLocais(PrimeiroAcessoRequest request) {
        if (!request.senha().equals(request.confirmarSenha())) {
            throw new SenhaDivergenteException();
        }
        if (!AvatarCatalogo.contem(request.avatar())) {
            throw new CampoInvalidoException("avatar", "Avatar inválido.");
        }
        if (request.dataNascimento().isBefore(LocalDate.now().minusYears(IDADE_MAXIMA_ANOS))) {
            throw new CampoInvalidoException("dataNascimento", "Data de nascimento inválida.");
        }
    }

    private RuntimeException conflitoDe(DataIntegrityViolationException e) {
        String causa = String.valueOf(e.getMostSpecificCause().getMessage()).toLowerCase(Locale.ROOT);
        if (causa.contains("matricula")) {
            return CadastroDuplicadoException.matricula();
        }
        if (causa.contains("email")) {
            return CadastroDuplicadoException.email();
        }
        return e;
    }

    /**
     * Janela residual aceita: se o commit local falhar depois da matrícula remota, fica um
     * turma_aluno órfão com um alunoId que nunca será reutilizado (as sequences não recuam).
     */
    private void avisarSeCommitFalhar(Long turmaId, Long alunoId) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    log.warn("Primeiro acesso desfeito após a matrícula remota: turma_aluno órfão "
                            + "(turma id={}, aluno id={})", turmaId, alunoId);
                }
            }
        });
    }
}
