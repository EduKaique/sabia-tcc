-- REMOÇÃO dos dados de demonstração do Sabiá (faixa reservada de ids >= 9.000.000), nos schemas auth e pedagogico.
-- NÃO é executado automaticamente em lugar nenhum. Rode manualmente, de preferência após backup:
--   psql -v ON_ERROR_STOP=1 -U sabia -d sabia -f database/seed-demo/remover-demo.sql
-- Antes: desligue o seed (SABIA_SEED_DEMO=false) e recrie auth-service e pedagogico-service; senão ele reinsere no próximo boot.
--
-- Escopo: apaga SOMENTE linhas da faixa reservada e as linhas que apontam para ela (ex.: aluno real que entrou na
-- turma DEMO01 ou entregou atividade demo durante a apresentação). Linhas reais fora da faixa e sem vínculo não são tocadas.
-- Cada DELETE tem, em comentário, o SELECT de conferência com a contagem esperada ANTES de apagar.
-- Tudo roda numa transação: erro = nada é apagado.

BEGIN;

-- ============================ pedagogico (filhos antes dos pais) ============================
-- SELECT count(*) FROM pedagogico.progresso_pagina WHERE aluno_id >= 9000000 OR id >= 9000000 OR pagina_id IN (SELECT id FROM pedagogico.pagina_licao WHERE licao_id >= 9000000);
DELETE FROM pedagogico.progresso_pagina
 WHERE aluno_id >= 9000000 OR id >= 9000000
    OR pagina_id IN (SELECT id FROM pedagogico.pagina_licao WHERE licao_id >= 9000000);

-- SELECT count(*) FROM pedagogico.progresso_licao WHERE aluno_id >= 9000000 OR id >= 9000000 OR licao_id >= 9000000;
DELETE FROM pedagogico.progresso_licao WHERE aluno_id >= 9000000 OR id >= 9000000 OR licao_id >= 9000000;

-- SELECT count(*) FROM pedagogico.pagina_licao WHERE id >= 9000000 OR licao_id >= 9000000;
DELETE FROM pedagogico.pagina_licao WHERE id >= 9000000 OR licao_id >= 9000000;

-- SELECT count(*) FROM pedagogico.licao_turma WHERE id >= 9000000 OR licao_id >= 9000000 OR turma_id >= 9000000;
DELETE FROM pedagogico.licao_turma WHERE id >= 9000000 OR licao_id >= 9000000 OR turma_id >= 9000000;

-- SELECT count(*) FROM pedagogico.licao WHERE id >= 9000000 OR professor_id >= 9000000;
DELETE FROM pedagogico.licao WHERE id >= 9000000 OR professor_id >= 9000000;

-- SELECT count(*) FROM pedagogico.correcao WHERE id >= 9000000 OR submissao_id IN (SELECT id FROM pedagogico.submissao_avaliativa WHERE id >= 9000000 OR aluno_id >= 9000000 OR atividade_id >= 9000000);
DELETE FROM pedagogico.correcao
 WHERE id >= 9000000
    OR submissao_id IN (SELECT id FROM pedagogico.submissao_avaliativa
                         WHERE id >= 9000000 OR aluno_id >= 9000000 OR atividade_id >= 9000000);

-- A submissão e o projeto avaliado dela (projeto_avaliativo) saem juntos.
-- SELECT count(*) FROM pedagogico.submissao_avaliativa WHERE id >= 9000000 OR aluno_id >= 9000000 OR atividade_id >= 9000000;
WITH s AS (
  DELETE FROM pedagogico.submissao_avaliativa
   WHERE id >= 9000000 OR aluno_id >= 9000000 OR atividade_id >= 9000000
  RETURNING projeto_id
)
DELETE FROM pedagogico.projeto_avaliativo WHERE id >= 9000000 OR id IN (SELECT projeto_id FROM s);

-- SELECT count(*) FROM pedagogico.projeto_sandbox WHERE id >= 9000000 OR aluno_id >= 9000000 OR origem_atividade_id >= 9000000;
DELETE FROM pedagogico.projeto_sandbox WHERE id >= 9000000 OR aluno_id >= 9000000 OR origem_atividade_id >= 9000000;

-- SELECT count(*) FROM pedagogico.cenario_robo WHERE id >= 9000000 OR professor_id >= 9000000;
DELETE FROM pedagogico.cenario_robo WHERE id >= 9000000 OR professor_id >= 9000000;

-- SELECT count(*) FROM pedagogico.atividade_avaliativa WHERE id >= 9000000 OR turma_id >= 9000000;
DELETE FROM pedagogico.atividade_avaliativa WHERE id >= 9000000 OR turma_id >= 9000000;

-- SELECT count(*) FROM pedagogico.turma_aluno WHERE id >= 9000000 OR aluno_id >= 9000000 OR turma_id >= 9000000;
DELETE FROM pedagogico.turma_aluno WHERE id >= 9000000 OR aluno_id >= 9000000 OR turma_id >= 9000000;

-- SELECT count(*) FROM pedagogico.turma WHERE id >= 9000000 OR professor_id >= 9000000;
DELETE FROM pedagogico.turma WHERE id >= 9000000 OR professor_id >= 9000000;

-- ============================ auth ============================
-- SELECT count(*) FROM auth.token_recuperacao_senha WHERE usuario_id >= 9000000;  -- esperado: 0 (o seed não cria)
DELETE FROM auth.token_recuperacao_senha WHERE usuario_id >= 9000000;

-- SELECT count(*) FROM auth.aluno WHERE id >= 9000000;      -- esperado: 6
DELETE FROM auth.aluno WHERE id >= 9000000;

-- SELECT count(*) FROM auth.professor WHERE id >= 9000000;  -- esperado: 2
DELETE FROM auth.professor WHERE id >= 9000000;

-- SELECT count(*) FROM auth.usuario WHERE id >= 9000000;    -- esperado: 8
DELETE FROM auth.usuario WHERE id >= 9000000;

-- SELECT count(*) FROM auth.instituicao WHERE id >= 9000000;  -- esperado: 1 (falha por FK se algum usuário real apontar para ela)
DELETE FROM auth.instituicao WHERE id >= 9000000;

COMMIT;
