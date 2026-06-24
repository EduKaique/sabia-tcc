package com.sabia.api.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI sabiaOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Sabiá API")
                        .description("API REST da plataforma de aprendizado Sabiá — TCC")
                        .version("v0.1.0")
                        .contact(new Contact()
                                .name("Eduardo Alberico")
                                .email("eduardoalberico18@gmail.com")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
