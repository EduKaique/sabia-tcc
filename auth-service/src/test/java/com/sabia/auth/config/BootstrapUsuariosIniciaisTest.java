package com.sabia.auth.config;

import com.sabia.auth.model.usuario.PerfilUsuario;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BootstrapUsuariosIniciaisTest {

    private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final MockEnvironment env = new MockEnvironment();
    private final BootstrapUsuariosIniciais bootstrap =
            new BootstrapUsuariosIniciais(usuarioRepository, passwordEncoder, env);

    @Test
    void criaAdminEProfessorAPartirDasVariaveis() {
        env.withProperty("SABIA_ADMIN_EMAIL", "admin@escola.edu")
                .withProperty("SABIA_ADMIN_SENHA", "senha-admin-forte")
                .withProperty("SABIA_PROFESSOR_EMAIL", "prof@escola.edu")
                .withProperty("SABIA_PROFESSOR_SENHA", "senha-prof-forte")
                .withProperty("SABIA_PROFESSOR_NOME", "Maria Silva")
                .withProperty("SABIA_PROFESSOR_CPF", "12345678909");

        bootstrap.run(null);

        List<Usuario> salvos = capturarSalvos(2);
        Usuario admin = salvos.get(0);
        assertThat(admin.getTipoPerfil()).isEqualTo(PerfilUsuario.ADMINISTRADOR);
        assertThat(admin.getEmail()).isEqualTo("admin@escola.edu");
        assertThat(admin.getNome()).isEqualTo("Administrador");
        assertThat(admin.getCpf()).isEqualTo("00000000000");
        assertThat(admin.isMustChangePassword()).isFalse();
        assertThat(admin.getSenhaHash()).isNotEqualTo("senha-admin-forte");
        assertThat(passwordEncoder.matches("senha-admin-forte", admin.getSenhaHash())).isTrue();

        Usuario professor = salvos.get(1);
        assertThat(professor.getTipoPerfil()).isEqualTo(PerfilUsuario.PROFESSOR);
        assertThat(professor.getEmail()).isEqualTo("prof@escola.edu");
        assertThat(professor.getNome()).isEqualTo("Maria Silva");
        assertThat(professor.getCpf()).isEqualTo("12345678909");
        assertThat(passwordEncoder.matches("senha-prof-forte", professor.getSenhaHash())).isTrue();
    }

    @Test
    void naoRecriaUsuarioQueJaExiste() {
        env.withProperty("SABIA_ADMIN_EMAIL", "admin@escola.edu")
                .withProperty("SABIA_ADMIN_SENHA", "senha-admin-forte");
        when(usuarioRepository.existsByEmailIgnoreCase("admin@escola.edu")).thenReturn(true);

        bootstrap.run(null);

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void semEmailNaoCriaNada() {
        env.withProperty("SABIA_ADMIN_SENHA", "senha-admin-forte")
                .withProperty("SABIA_PROFESSOR_EMAIL", "  ");

        bootstrap.run(null);

        verify(usuarioRepository, never()).existsByEmailIgnoreCase(anyString());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void semSenhaUsaSenhaPadrao() {
        env.withProperty("SABIA_PROFESSOR_EMAIL", "prof@escola.edu");

        bootstrap.run(null);

        Usuario professor = capturarSalvos(1).get(0);
        assertThat(professor.getCpf()).isEqualTo("00000000001");
        assertThat(passwordEncoder.matches(BootstrapUsuariosIniciais.SENHA_PADRAO, professor.getSenhaHash()))
                .isTrue();
    }

    private List<Usuario> capturarSalvos(int quantidade) {
        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository, times(quantidade)).save(captor.capture());
        return captor.getAllValues();
    }
}
