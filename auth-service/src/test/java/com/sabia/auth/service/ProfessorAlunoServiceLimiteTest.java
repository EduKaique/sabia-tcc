package com.sabia.auth.service;

import com.sabia.auth.client.PedagogicoClient;
import com.sabia.auth.client.PedagogicoClient.AlunoDaTurmaRemoto;
import com.sabia.auth.dto.request.RedefinirSenhaAlunoRequest;
import com.sabia.auth.dto.request.RedefinirSenhaAlunoRequest.Modo;
import com.sabia.auth.model.usuario.Aluno;
import com.sabia.auth.model.usuario.PerfilUsuario;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.repository.AlunoRepository;
import com.sabia.auth.repository.UsuarioRepository;
import com.sabia.auth.security.LimiteTentativasLogin;
import com.sabia.auth.service.senha.GeradorSenhaAmigavel;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Redefinir a senha do aluno libera a conta dele no limite de tentativas de login. */
class ProfessorAlunoServiceLimiteTest {

    private final PedagogicoClient pedagogicoClient = mock(PedagogicoClient.class);
    private final AlunoRepository alunoRepository = mock(AlunoRepository.class);
    private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
    private final LimiteTentativasLogin limite = mock(LimiteTentativasLogin.class);
    private final ProfessorAlunoService service = new ProfessorAlunoService(pedagogicoClient, alunoRepository,
            usuarioRepository, NoOpPasswordEncoder.getInstance(), new GeradorSenhaAmigavel(), limite);

    @Test
    void redefinirSenhaLiberaEmailEMatriculaDoAluno() {
        Usuario professor = Usuario.builder().id(1L).nome("Ana").tipoPerfil(PerfilUsuario.PROFESSOR).build();
        Usuario aluno = Usuario.builder().id(7L).nome("Bia").email("bia@escola.edu")
                .tipoPerfil(PerfilUsuario.ALUNO).build();
        when(pedagogicoClient.listarAlunosDaTurma(3L, 1L))
                .thenReturn(List.of(new AlunoDaTurmaRemoto(7L, "Bia", null)));
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(aluno));
        when(alunoRepository.findById(7L))
                .thenReturn(Optional.of(Aluno.builder().id(7L).usuario(aluno).matricula("2026AB01").build()));

        service.redefinirSenha(professor, 3L, 7L, new RedefinirSenhaAlunoRequest(Modo.ALEATORIA, null, true));

        verify(limite).liberar("bia@escola.edu", "2026AB01");
    }
}
