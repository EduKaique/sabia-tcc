package com.sabia.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sabia.auth.model.usuario.PerfilUsuario;
import com.sabia.auth.model.usuario.Usuario;
import com.sabia.auth.repository.AlunoRepository;
import com.sabia.auth.repository.ProfessorRepository;
import com.sabia.auth.repository.UsuarioRepository;
import com.sabia.auth.service.email.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class AdminProfessorControllerTest {

    private static final String EMAIL_ADMIN = "admin@sabia.edu";
    private static final String EMAIL_PROFESSOR = "professor@sabia.edu";
    private static final String EMAIL_ALUNO = "aluno@sabia.edu";

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

    @MockitoBean
    private EmailService emailService;

    private final ObjectMapper json = new ObjectMapper();
    private MockMvc mvc;
    private Long professorId;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        alunoRepository.deleteAll();
        professorRepository.deleteAll();
        usuarioRepository.deleteAll();

        usuarioRepository.save(Usuario.builder()
                .nome("Admin Sabiá")
                .cpf("00000000000")
                .email(EMAIL_ADMIN)
                .senhaHash(passwordEncoder.encode("password"))
                .tipoPerfil(PerfilUsuario.ADMINISTRADOR)
                .build());

        Usuario professor = usuarioRepository.save(Usuario.builder()
                .nome("Ana Professora")
                .cpf("12345678901")
                .email(EMAIL_PROFESSOR)
                .senhaHash(passwordEncoder.encode("password"))
                .tipoPerfil(PerfilUsuario.PROFESSOR)
                .build());
        professorId = professor.getId();

        usuarioRepository.save(Usuario.builder()
                .nome("Carlos Aluno")
                .cpf("98765432100")
                .email(EMAIL_ALUNO)
                .senhaHash(passwordEncoder.encode("password"))
                .tipoPerfil(PerfilUsuario.ALUNO)
                .build());
    }

    private String logar(String email) throws Exception {
        String body = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.createObjectNode().put("email", email).put("senha", "password").toString()))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("token").asText();
    }

    @Test
    void listar_comoAdmin_retornaProfessores() throws Exception {
        String token = logar(EMAIL_ADMIN);

        mvc.perform(get("/api/admin/professores").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value(EMAIL_PROFESSOR));
    }

    @Test
    void listar_comoProfessor_retorna403() throws Exception {
        String token = logar(EMAIL_PROFESSOR);

        mvc.perform(get("/api/admin/professores").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void listar_comoAluno_retorna403() throws Exception {
        String token = logar(EMAIL_ALUNO);

        mvc.perform(get("/api/admin/professores").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void criar_comoAdmin_geraSenhaTemporariaEEnviaEmail() throws Exception {
        String token = logar(EMAIL_ADMIN);

        mvc.perform(post("/api/admin/professores")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"nomeCompleto":"Novo Professor","cpf":"11111111111","email":"novo.professor@sabia.edu"}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("novo.professor@sabia.edu"))
                .andExpect(jsonPath("$.ativo").value(true))
                .andExpect(jsonPath("$.mustChangePassword").value(true));

        ArgumentCaptor<String> senhaCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).enviarSenhaTemporaria(eq("novo.professor@sabia.edu"), eq("Novo Professor"), senhaCaptor.capture());
        String senhaTemporaria = senhaCaptor.getValue();

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.createObjectNode().put("email", "novo.professor@sabia.edu").put("senha", "senha-errada").toString()))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.createObjectNode().put("email", "novo.professor@sabia.edu").put("senha", senhaTemporaria).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword").value(true));
    }

    @Test
    void criar_comCpfJaCadastrado_retorna409() throws Exception {
        String token = logar(EMAIL_ADMIN);

        mvc.perform(post("/api/admin/professores")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"nomeCompleto":"Duplicado","cpf":"12345678901","email":"duplicado@sabia.edu"}"""))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("CPF já cadastrado."));
    }

    @Test
    void criar_comEmailJaCadastrado_retorna409() throws Exception {
        String token = logar(EMAIL_ADMIN);

        mvc.perform(post("/api/admin/professores")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"nomeCompleto":"Duplicado","cpf":"22222222222","email":"professor@sabia.edu"}"""))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("E-mail já cadastrado."));
    }

    @Test
    void desativar_bloqueiaLoginEDerrubaTokenExistente() throws Exception {
        String tokenAdmin = logar(EMAIL_ADMIN);
        String tokenProfessorAntigo = logar(EMAIL_PROFESSOR);

        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + tokenProfessorAntigo))
                .andExpect(status().isOk());

        mvc.perform(patch("/api/admin/professores/" + professorId + "/desativar")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk());

        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + tokenProfessorAntigo))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.createObjectNode().put("email", EMAIL_PROFESSOR).put("senha", "password").toString()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.erro").value("Usuário inativo."));
    }

    @Test
    void reativar_devolveOAcesso() throws Exception {
        String tokenAdmin = logar(EMAIL_ADMIN);

        mvc.perform(patch("/api/admin/professores/" + professorId + "/desativar")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk());

        mvc.perform(patch("/api/admin/professores/" + professorId + "/reativar")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk());

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.createObjectNode().put("email", EMAIL_PROFESSOR).put("senha", "password").toString()))
                .andExpect(status().isOk());
    }

    @Test
    void desativar_comIdInexistente_retorna404() throws Exception {
        String tokenAdmin = logar(EMAIL_ADMIN);

        mvc.perform(patch("/api/admin/professores/999999/desativar")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erro").value("Professor não encontrado."));
    }
}
