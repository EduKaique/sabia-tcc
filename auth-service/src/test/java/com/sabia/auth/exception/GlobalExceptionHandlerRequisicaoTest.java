package com.sabia.auth.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Erros de requisição (corpo, parâmetro, método, media type, rota) devolvem 4xx no formato ErroResponse. */
@SpringJUnitWebConfig(GlobalExceptionHandlerRequisicaoTest.Config.class)
class GlobalExceptionHandlerRequisicaoTest {

    @Configuration
    @EnableWebMvc
    @Import({GlobalExceptionHandler.class, ControllerDeTeste.class})
    static class Config {}

    enum Cor { AZUL, VERDE }

    record Corpo(Cor cor) {}

    @RestController
    static class ControllerDeTeste {
        @PostMapping(path = "/teste/corpo", consumes = MediaType.APPLICATION_JSON_VALUE)
        String corpo(@RequestBody Corpo corpo) {
            return "ok";
        }

        @GetMapping("/teste/param")
        String param(@RequestParam Long id) {
            return "ok";
        }
    }

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    @Test
    void jsonMalformadoDevolve400() throws Exception {
        esperar(mockMvc.perform(post("/teste/corpo").contentType(MediaType.APPLICATION_JSON).content("{\"cor\":")),
                400, "Requisição inválida.");
    }

    @Test
    void enumInvalidoNoCorpoDevolve400() throws Exception {
        esperar(mockMvc.perform(post("/teste/corpo").contentType(MediaType.APPLICATION_JSON).content("{\"cor\":\"ROXO\"}")),
                400, "Requisição inválida.");
    }

    @Test
    void tipoInvalidoEmParametroDevolve400() throws Exception {
        esperar(mockMvc.perform(get("/teste/param").param("id", "abc")), 400, "Requisição inválida.");
    }

    @Test
    void parametroObrigatorioAusenteDevolve400() throws Exception {
        esperar(mockMvc.perform(get("/teste/param")), 400, "Requisição inválida.");
    }

    @Test
    void metodoNaoSuportadoDevolve405ComAllow() throws Exception {
        esperar(mockMvc.perform(delete("/teste/param")), 405, "Método não permitido.")
                .andExpect(header().exists("Allow"));
    }

    @Test
    void mediaTypeNaoSuportadoDevolve415() throws Exception {
        esperar(mockMvc.perform(post("/teste/corpo").contentType(MediaType.TEXT_PLAIN).content("azul")),
                415, "Tipo de conteúdo não suportado.");
    }

    @Test
    void rotaInexistenteDevolve404() throws Exception {
        esperar(mockMvc.perform(get("/teste/nao-existe")), 404, "Recurso não encontrado.");
    }

    private ResultActions esperar(ResultActions resultado, int codigo, String erro) throws Exception {
        return resultado.andExpect(status().is(codigo))
                .andExpect(jsonPath("$.status").value(codigo))
                .andExpect(jsonPath("$.erro").value(erro))
                .andExpect(jsonPath("$.timestamp").exists());
    }
}
