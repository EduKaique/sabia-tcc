-- ================================================================
-- data.sql  —  Seed de desenvolvimento do auth-service
-- Senha de todos os usuários: senha123
-- IDs 2 (professor) e 3 (aluno) coincidem com o seed do monólito `api/`
-- para que o mesmo token JWT resolva nos dois serviços durante a transição.
-- ================================================================

-- 0. CPF opcional para ALUNO (primeiro acesso por convite, HU003.2). O ddl-auto: update
--    não relaxa NOT NULL em coluna existente; em base nova a coluna já nasce nullable (idempotente).
ALTER TABLE usuario ALTER COLUMN cpf DROP NOT NULL;

-- 0.1 E-mail opcional para ALUNO (entra pela matrícula). Mesmo motivo do ALTER acima.
ALTER TABLE usuario ALTER COLUMN email DROP NOT NULL;

-- 1. Instituição
INSERT INTO instituicao (id, nome, cnpj, criada_em)
VALUES (1, 'Universidade Federal do Brasil', '00.000.000/0001-00', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 2. Administrador
INSERT INTO usuario (id, instituicao_id, nome, cpf, email, senha_hash, tipo_perfil, criado_em)
VALUES (
    1, 1, 'Admin Sabiá', '00000000000', 'admin@sabia.edu',
    '$2a$10$NMi8koKdplXEAFg7WsxUAOfQTMM0BQKeZUNrURtIxnEnYXi56i56u',
    'ADMINISTRADOR', CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- 3. Professor
INSERT INTO usuario (id, instituicao_id, nome, cpf, email, senha_hash, tipo_perfil, criado_em)
VALUES (
    2, 1, 'Ana Professora', '12345678901', 'professor@sabia.edu',
    '$2a$10$NMi8koKdplXEAFg7WsxUAOfQTMM0BQKeZUNrURtIxnEnYXi56i56u',
    'PROFESSOR', CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- 3. Professor
INSERT INTO usuario (id, instituicao_id, nome, cpf, email, senha_hash, tipo_perfil, criado_em)
VALUES (
    4, 1, 'Edu Teste', '12345678910', 'dev@sabia.edu',
    '$2a$10$NMi8koKdplXEAFg7WsxUAOfQTMM0BQKeZUNrURtIxnEnYXi56i56u',
    'PROFESSOR', CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO professor (id, especialidade)
VALUES (2, 'Programação')
ON CONFLICT (id) DO NOTHING;

-- 4. Aluno
INSERT INTO usuario (id, instituicao_id, nome, cpf, email, senha_hash, tipo_perfil, criado_em)
VALUES (
    3, 1, 'Carlos Aluno', '98765432100', 'aluno@sabia.edu',
    '$2a$10$NMi8koKdplXEAFg7WsxUAOfQTMM0BQKeZUNrURtIxnEnYXi56i56u',
    'ALUNO', CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO aluno (id, pontuacao_geral, perfil_completo)
VALUES (3, 0, true)
ON CONFLICT (id) DO NOTHING;

-- Bases criadas antes deste ajuste já têm o aluno 3 com perfil incompleto (idempotente)
UPDATE aluno
SET perfil_completo = true
WHERE id = 3 AND perfil_completo = false;

-- 5. Alunos sem turma (para testar a matrícula pelo professor)
--    Senha: senha123 · perfil completo (CPF e matrícula preenchidos)
INSERT INTO usuario (id, instituicao_id, nome, cpf, email, senha_hash, tipo_perfil, criado_em) VALUES
    (5, 1, 'Beatriz Souza',   '11122233301', 'beatriz@sabia.edu', '$2a$10$NMi8koKdplXEAFg7WsxUAOfQTMM0BQKeZUNrURtIxnEnYXi56i56u', 'ALUNO', CURRENT_TIMESTAMP),
    (6, 1, 'Daniel Lima',     '11122233302', 'daniel@sabia.edu',  '$2a$10$NMi8koKdplXEAFg7WsxUAOfQTMM0BQKeZUNrURtIxnEnYXi56i56u', 'ALUNO', CURRENT_TIMESTAMP),
    (7, 1, 'Fernanda Rocha',  '11122233303', 'fernanda@sabia.edu', '$2a$10$NMi8koKdplXEAFg7WsxUAOfQTMM0BQKeZUNrURtIxnEnYXi56i56u', 'ALUNO', CURRENT_TIMESTAMP),
    (8, 1, 'Gabriel Martins', '11122233304', 'gabriel@sabia.edu', '$2a$10$NMi8koKdplXEAFg7WsxUAOfQTMM0BQKeZUNrURtIxnEnYXi56i56u', 'ALUNO', CURRENT_TIMESTAMP),
    (9, 1, 'Helena Costa',    '11122233305', 'helena@sabia.edu',  '$2a$10$NMi8koKdplXEAFg7WsxUAOfQTMM0BQKeZUNrURtIxnEnYXi56i56u', 'ALUNO', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO aluno (id, pontuacao_geral, matricula, perfil_completo) VALUES
    (5, 0, '20260001', true),
    (6, 0, '20260002', true),
    (7, 0, '20260003', true),
    (8, 0, '20260004', true),
    (9, 0, '20260005', true)
ON CONFLICT (id) DO NOTHING;

-- 5.1 Matrícula normalizada (sem espaços nas pontas, em maiúsculas), como o cadastro grava.
--     Idempotente; pula a linha que colidiria com outra matrícula já normalizada.
UPDATE aluno a
SET matricula = upper(btrim(a.matricula))
WHERE a.matricula <> upper(btrim(a.matricula))
  AND NOT EXISTS (SELECT 1 FROM aluno b WHERE b.id <> a.id AND b.matricula = upper(btrim(a.matricula)));

-- 6. Sincroniza as sequences com os ids fixos do seed (idempotente; roda a cada reinício)
--    Os INSERTs acima usam ids explícitos, que não avançam as sequences IDENTITY.
--    Alvo = maior entre max(id) e o last_value atual: a sequence NUNCA recua.
--    Como não há FK entre schemas, reaproveitar ids de registros apagados poderia
--    associar linhas órfãs de outro serviço (ex.: turma_aluno) a um registro novo.
--    last_value é NULL em sequence nunca usada; tabela vazia volta a começar em 1.
SELECT CASE WHEN alvo > 0 THEN setval(seq, alvo, true) ELSE setval(seq, 1, false) END
FROM (
    SELECT s.seq,
           GREATEST(COALESCE((SELECT MAX(id) FROM instituicao), 0), COALESCE(ps.last_value, 0)) AS alvo
    FROM (SELECT pg_get_serial_sequence('instituicao', 'id') AS seq) s
    LEFT JOIN pg_sequences ps ON format('%I.%I', ps.schemaname, ps.sequencename) = s.seq
) x;

SELECT CASE WHEN alvo > 0 THEN setval(seq, alvo, true) ELSE setval(seq, 1, false) END
FROM (
    SELECT s.seq,
           GREATEST(COALESCE((SELECT MAX(id) FROM usuario), 0), COALESCE(ps.last_value, 0)) AS alvo
    FROM (SELECT pg_get_serial_sequence('usuario', 'id') AS seq) s
    LEFT JOIN pg_sequences ps ON format('%I.%I', ps.schemaname, ps.sequencename) = s.seq
) x;
