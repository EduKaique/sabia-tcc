-- ================================================================
-- data.sql  —  Seed de desenvolvimento
-- Senha de todos os usuários: password
-- ================================================================

-- 1. Instituição
INSERT INTO instituicao (id, nome, cnpj, modalidade, categoria, criada_em)
VALUES (
    1,
    'Universidade Federal do Brasil',
    '00.000.000/0001-00',
    'PRESENCIAL',
    'FEDERAL',
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- 2. Usuário professor
INSERT INTO usuario (id, instituicao_id, nome, cpf, email, senha_hash, tipo_perfil, criado_em)
VALUES (
    2,
    1,
    'Ana Professora',
    '12345678901',
    'professor@sabia.edu',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    'PROFESSOR',
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO professor (id, especialidade)
VALUES (
    2,
    'Programação'
) ON CONFLICT (id) DO NOTHING;

-- 3. Usuário aluno
INSERT INTO usuario (id, instituicao_id, nome, cpf, email, senha_hash, tipo_perfil, criado_em)
VALUES (
    3,
    1,
    'Carlos Aluno',
    '98765432100',
    'aluno@sabia.edu',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    'ALUNO',
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO aluno (id, pontuacao_geral)
VALUES (
    3,
    0
) ON CONFLICT (id) DO NOTHING;

-- 4. Turma
INSERT INTO turma (id, nome, professor_id, instituicao_id, criada_em)
VALUES (
    10,
    'Programação I — 2025/1',
    2,
    1,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- 5. Matrícula do aluno na turma
INSERT INTO turma_aluno (id, turma_id, aluno_id, ingresso_em)
VALUES (
    30,
    10,
    3,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- 6. Atividades com status diferentes

-- 6.1 Rascunho (sem prazo)
INSERT INTO atividade (id, turma_id, titulo, descricao, data_entrega, pontuacao_maxima, e_gerada_ia, status, estado_json, criada_em)
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

-- 6.2 Publicada com prazo futuro
INSERT INTO atividade (id, turma_id, titulo, descricao, data_entrega, pontuacao_maxima, e_gerada_ia, status, estado_json, criada_em)
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

-- 6.3 Publicada com prazo encerrado
INSERT INTO atividade (id, turma_id, titulo, descricao, data_entrega, pontuacao_maxima, e_gerada_ia, status, estado_json, criada_em)
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
