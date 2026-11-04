package com.sabia.auth.messaging.contrato;

/** Routing keys e contratos (payloads) dos eventos publicados pelo auth-service. */
public final class Eventos {

    public static final String ALUNO_PERFIL_ATUALIZADO = "aluno.perfil-atualizado";

    private Eventos() {}

    /** O aluno completou/atualizou o perfil; consumidores usam o nome para manter cópias locais. */
    public record AlunoPerfilAtualizado(Long alunoId, String nomeCompleto) {}
}
