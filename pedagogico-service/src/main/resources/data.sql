-- ================================================================
-- data.sql  —  Seed de desenvolvimento (Serviço Pedagógico)
--
-- professor_id=2 e aluno_id=3 e instituicao_id=1 correspondem aos ids do
-- Usuario/Professor/Aluno/Instituicao seedados no banco do módulo `api`
-- (ver api/src/main/resources/data.sql) — aqui são apenas valores Long
-- escalares, sem FK entre bancos (schema-per-service).
-- ================================================================

-- 1. Turma
INSERT INTO turma (id, nome, professor_id, instituicao_id, etapa, criada_em)
VALUES (
    10,
    'Programação I — 2025/1',
    2,
    1,
    'ANOS_INICIAIS',
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- 2. Matrícula do aluno na turma
INSERT INTO turma_aluno (id, turma_id, aluno_id, ingresso_em)
VALUES (
    30,
    10,
    3,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- 3. Atividades com status diferentes

-- 3.1 Rascunho (sem prazo)
INSERT INTO atividade_avaliativa (id, turma_id, titulo, descricao, data_entrega, pontuacao_maxima, e_gerada_ia, status, gabarito_estado_json, criada_em)
VALUES (
    20,
    10,
    'Introdução ao Scratch',
    '<p>Crie um projeto simples no Scratch demonstrando conceitos básicos: sequências, laços e condicionais.</p>',
    NULL,
    10,
    false,
    'RASCUNHO',
    NULL,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- 3.2 Publicada com prazo futuro
INSERT INTO atividade_avaliativa (id, turma_id, titulo, descricao, data_entrega, pontuacao_maxima, e_gerada_ia, status, gabarito_estado_json, criada_em)
VALUES (
    21,
    10,
    'Projeto Final — Animação',
    '<p>Desenvolva uma animação no Scratch com pelo menos dois personagens e uma narrativa coerente.</p><ul><li>Mínimo de 30 segundos</li><li>Uso de variáveis</li><li>Pelo menos um laço</li></ul>',
    '2026-07-31 23:59:00',
    30,
    false,
    'PUBLICADA',
    NULL,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- 3.3 Publicada com prazo encerrado
INSERT INTO atividade_avaliativa (id, turma_id, titulo, descricao, data_entrega, pontuacao_maxima, e_gerada_ia, status, gabarito_estado_json, criada_em)
VALUES (
    22,
    10,
    'Quiz — Conceitos de Algoritmos',
    '<p>Responda as questões sobre algoritmos e estruturas de controle. Use o Scratch para exemplificar cada resposta.</p>',
    '2026-06-01 23:59:00',
    20,
    false,
    'PUBLICADA',
    NULL,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- 4. Campos da HU014 na turma seed (colunas adicionadas depois; idempotente)
UPDATE turma
SET ano_serie = '5º ano', turno = 'MANHA', codigo_convite = 'SABIA1'
WHERE id = 10 AND codigo_convite IS NULL;
