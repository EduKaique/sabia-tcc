package com.sabia.pedagogico.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubmeterAtividadeRequest(
        @NotBlank @Size(max = 65536, message = "O projeto passa do limite de 64 KB.") String estadoJson
) {}
