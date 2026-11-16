package com.sabia.auth;

import com.sabia.auth.model.usuario.Aluno;
import com.sabia.auth.model.usuario.PerfilUsuario;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.repository.AlunoRepository;
import com.sabia.auth.repository.ProfessorRepository;
import com.sabia.auth.repository.UsuarioRepository;
import com.sabia.auth.security.LimiteTentativasLogin;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Limite de tentativas por conta no POST /api/auth/login (3 falhas para o teste ser curto). */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {"sabia.login.max-falhas=3", "sabia.login.bloqueio-minutos=15"})
class LoginLimiteTentativasTest {

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private AlunoRepository alunoRepository;
    @Autowired
    private ProfessorRepository professorRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private LimiteTentativasLogin limite;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        alunoRepository.deleteAll();
        professorRepository.deleteAll();
        usuarioRepository.deleteAll();
        limite.liberar("2026AB01", "2026AB02");
        criarAluno("Beatriz Souza", "2026AB01");
        criarAluno("Caio Lima", "2026AB02");
    }

    private void criarAluno(String nome, String matricula) {
        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .nome(nome)
                .senhaHash(passwordEncoder.encode("password"))
                .tipoPerfil(PerfilUsuario.ALUNO)
                .build());
        alunoRepository.save(Aluno.builder().usuario(usuario).matricula(matricula).build());
    }

    private ResultActions logar(String login, String senha) throws Exception {
        return mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"login\":\"" + login + "\",\"senha\":\"" + senha + "\"}"));
    }

    private void errar(String login, int vezes) throws Exception {
        for (int i = 0; i < vezes; i++) {
            logar(login, "errada").andExpect(status().isUnauthorized());
        }
    }

    @Test
    void depoisDoMaximoDeFalhasResponde429ComRetryAfter() throws Exception {
        errar("2026AB01", 3);

        logar("2026AB01", "errada")
                .andExpect(status().isTooManyRequests())
                .andExpect(result -> {
                    long segundos = Long.parseLong(result.getResponse().getHeader("Retry-After"));
                    assertThat(segundos).isBetween(1L, 900L);
                })
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.erro").value("Muitas tentativas. Aguarde alguns minutos e tente novamente."));
    }

    @Test
    void senhaCorretaDuranteOBloqueioTambemRecebe429() throws Exception {
        errar(" 2026ab01 ", 3);

        logar("2026AB01", "password").andExpect(status().isTooManyRequests());
    }

    @Test
    void loginCertoZeraOContador() throws Exception {
        errar("2026AB01", 2);
        logar("2026AB01", "password").andExpect(status().isOk());

        errar("2026AB01", 2);
        logar("2026AB01", "password").andExpect(status().isOk());
    }

    @Test
    void outraContaContinuaEntrando() throws Exception {
        errar("2026AB01", 3);

        logar("2026AB02", "password").andExpect(status().isOk());
    }

    @Test
    void loginInexistenteTambemEhLimitado() throws Exception {
        errar("2099ZZ99", 3);

        logar("2099ZZ99", "errada").andExpect(status().isTooManyRequests());
        limite.liberar("2099ZZ99");
    }
}
