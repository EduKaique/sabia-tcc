-- ================================================================
-- data.sql  —  Seed de desenvolvimento do auth-service
-- Senha de todos os usuários: password
-- IDs 2 (professor) e 3 (aluno) coincidem com o seed do monólito `api/`
-- para que o mesmo token JWT resolva nos dois serviços durante a transição.
-- ================================================================

-- 1. Instituição
INSERT INTO instituicao (id, nome, cnpj, criada_em)
VALUES (1, 'Universidade Federal do Brasil', '00.000.000/0001-00', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 2. Administrador
INSERT INTO usuario (id, instituicao_id, nome, cpf, email, senha_hash, tipo_perfil, criado_em)
VALUES (
    1, 1, 'Admin Sabiá', '00000000000', 'admin@sabia.edu',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    'ADMINISTRADOR', CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- 3. Professor
INSERT INTO usuario (id, instituicao_id, nome, cpf, email, senha_hash, tipo_perfil, criado_em)
VALUES (
    2, 1, 'Ana Professora', '12345678901', 'professor@sabia.edu',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    'PROFESSOR', CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- 3. Professor
INSERT INTO usuario (id, instituicao_id, nome, cpf, email, senha_hash, tipo_perfil, criado_em)
VALUES (
    4, 1, 'Edu Teste', '12345678910', 'eduardoalberico18@gmail.com',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    'PROFESSOR', CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO professor (id, especialidade)
VALUES (2, 'Programação')
ON CONFLICT (id) DO NOTHING;

-- 4. Aluno
INSERT INTO usuario (id, instituicao_id, nome, cpf, email, senha_hash, tipo_perfil, criado_em)
VALUES (
    3, 1, 'Carlos Aluno', '98765432100', 'aluno@sabia.edu',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    'ALUNO', CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO aluno (id, pontuacao_geral)
VALUES (3, 0)
ON CONFLICT (id) DO NOTHING;

-- 5. Alunos sem turma (para testar a matrícula pelo professor)
--    Senha: password · perfil completo (CPF e matrícula preenchidos)
INSERT INTO usuario (id, instituicao_id, nome, cpf, email, senha_hash, tipo_perfil, criado_em) VALUES
    (5, 1, 'Beatriz Souza',   '11122233301', 'beatriz@sabia.edu', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'ALUNO', CURRENT_TIMESTAMP),
    (6, 1, 'Daniel Lima',     '11122233302', 'daniel@sabia.edu',  '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'ALUNO', CURRENT_TIMESTAMP),
    (7, 1, 'Fernanda Rocha',  '11122233303', 'fernanda@sabia.edu', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'ALUNO', CURRENT_TIMESTAMP),
    (8, 1, 'Gabriel Martins', '11122233304', 'gabriel@sabia.edu', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'ALUNO', CURRENT_TIMESTAMP),
    (9, 1, 'Helena Costa',    '11122233305', 'helena@sabia.edu',  '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'ALUNO', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO aluno (id, pontuacao_geral, matricula, perfil_completo) VALUES
    (5, 0, '20260001', true),
    (6, 0, '20260002', true),
    (7, 0, '20260003', true),
    (8, 0, '20260004', true),
    (9, 0, '20260005', true)
ON CONFLICT (id) DO NOTHING;
