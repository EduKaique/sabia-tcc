-- ================================================================
-- data.sql  —  Seed de desenvolvimento
-- Senha de todos os usuários: password
-- ================================================================

-- 1. Instituição
INSERT INTO instituicao (id, nome, cnpj, criada_em)
VALUES (
    1,
    'Universidade Federal do Brasil',
    '00.000.000/0001-00',
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

-- Turma, matrícula e atividades avaliativas migraram para o banco dedicado do
-- pedagogico-service (ver pedagogico-service/src/main/resources/data.sql) — não
-- pertencem mais a este banco.
