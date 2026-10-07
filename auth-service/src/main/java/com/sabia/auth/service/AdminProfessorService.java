package com.sabia.auth.service;

import com.sabia.auth.dto.request.CriarProfessorRequest;
import com.sabia.auth.dto.response.ProfessorResponse;
import com.sabia.auth.exception.CpfJaCadastradoException;
import com.sabia.auth.exception.EmailJaCadastradoException;
import com.sabia.auth.exception.ProfessorNaoEncontradoException;
import com.sabia.auth.model.usuario.PerfilUsuario;
import com.sabia.auth.model.usuario.Professor;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.repository.ProfessorRepository;
import com.sabia.auth.repository.UsuarioRepository;
import com.sabia.auth.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminProfessorService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UsuarioRepository usuarioRepository;
    private final ProfessorRepository professorRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<ProfessorResponse> listar(Boolean ativo) {
        List<Usuario> usuarios = ativo == null
                ? usuarioRepository.findByTipoPerfil(PerfilUsuario.PROFESSOR)
                : usuarioRepository.findByTipoPerfilAndAtivo(PerfilUsuario.PROFESSOR, ativo);
        return usuarios.stream().map(ProfessorResponse::from).toList();
    }

    @Transactional
    public ProfessorResponse criar(Usuario admin, CriarProfessorRequest request) {
        if (usuarioRepository.existsByCpf(request.cpf())) {
            throw new CpfJaCadastradoException();
        }
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new EmailJaCadastradoException();
        }

        String senhaTemporaria = gerarSenhaTemporaria();

        Usuario usuario = Usuario.builder()
                .instituicao(admin.getInstituicao())
                .nome(request.nomeCompleto())
                .cpf(request.cpf())
                .email(request.email())
                .senhaHash(passwordEncoder.encode(senhaTemporaria))
                .tipoPerfil(PerfilUsuario.PROFESSOR)
                .mustChangePassword(true)
                .build();
        usuarioRepository.save(usuario);
        professorRepository.save(Professor.builder().usuario(usuario).build());

        emailService.enviarSenhaTemporaria(usuario.getEmail(), usuario.getNome(), senhaTemporaria);
        log.info("Professor id={} criado pelo admin id={}", usuario.getId(), admin.getId());

        return ProfessorResponse.from(usuario);
    }

    @Transactional
    public void desativar(Long id) {
        alterarStatus(id, false);
        log.info("Professor id={} desativado", id);
    }

    @Transactional
    public void reativar(Long id) {
        alterarStatus(id, true);
        log.info("Professor id={} reativado", id);
    }

    private void alterarStatus(Long id, boolean ativo) {
        Usuario professor = usuarioRepository.findById(id)
                .filter(u -> u.getTipoPerfil() == PerfilUsuario.PROFESSOR)
                .orElseThrow(ProfessorNaoEncontradoException::new);
        professor.setAtivo(ativo);
        usuarioRepository.save(professor);
    }

    private String gerarSenhaTemporaria() {
        byte[] bytes = new byte[9];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
