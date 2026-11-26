-- Seed de demonstração do auth-service (SABIA_SEED_DEMO=true). GERADO por docs/verificacao-seed/gerador/gerar_auth.py.
-- Somente INSERT ... ON CONFLICT DO NOTHING: nunca altera nem apaga dado existente. Separador de comandos: @@FIM@@
-- Faixa de ids reservada: 9.000.000 em diante. Sem setval: as sequences continuam fora da faixa.
-- Contas: ids 9000001-9000002 (professores), 9000011-9000016 (alunos). Senhas só no roteiro local (hash BCrypt custo 10).
-- ATENÇÃO: não renomear a linha-separador abaixo; HTML/JSON dos seeds contêm ';'.
INSERT INTO instituicao (id, nome, cnpj, criada_em) VALUES (9000001, 'Escola Demonstração Sabiá (Demo)', '00.000.000/0099-00', '2026-11-01 09:00:00') ON CONFLICT DO NOTHING
@@FIM@@
INSERT INTO usuario (id, instituicao_id, nome, cpf, email, senha_hash, tipo_perfil, criado_em, must_change_password, ativo) VALUES (9000001, 9000001, 'Marina Castelo (Demo)', '11144477735', 'marina.castelo@sabia.demo', '$2a$10$4cy5.I3V4b6oWz/0UoBsX.X67qbWxgNGQxstqqywCcSMhgg.5GGUq', 'PROFESSOR', '2026-11-01 09:00:00', false, true) ON CONFLICT DO NOTHING
@@FIM@@
INSERT INTO professor (id) VALUES (9000001) ON CONFLICT DO NOTHING
@@FIM@@
INSERT INTO usuario (id, instituicao_id, nome, cpf, email, senha_hash, tipo_perfil, criado_em, must_change_password, ativo) VALUES (9000002, 9000001, 'Rogério Tavares (Demo)', '12345678909', 'rogerio.tavares@sabia.demo', '$2a$10$ZXa1QjlwChykMU9Hlsj/.Oq5LxrCgP6nzngNm0laqnFd5lLRKY9LO', 'PROFESSOR', '2026-11-01 09:00:00', false, true) ON CONFLICT DO NOTHING
@@FIM@@
INSERT INTO professor (id) VALUES (9000002) ON CONFLICT DO NOTHING
@@FIM@@
INSERT INTO usuario (id, instituicao_id, nome, data_nascimento, senha_hash, tipo_perfil, criado_em, must_change_password, ativo) VALUES (9000011, 9000001, 'Lucas Almeida (Demo)', '2013-03-15', '$2a$10$4zF.jSGDwwbs5qB3DzxTdun3RPQ/ii5CONX7v/QO3ZKuJdeHEFMqC', 'ALUNO', '2026-11-01 09:00:00', false, true) ON CONFLICT DO NOTHING
@@FIM@@
INSERT INTO aluno (id, matricula, avatar, perfil_completo) VALUES (9000011, 'DEMO0001', 'sabia-azul', true) ON CONFLICT DO NOTHING
@@FIM@@
INSERT INTO usuario (id, instituicao_id, nome, data_nascimento, senha_hash, tipo_perfil, criado_em, must_change_password, ativo) VALUES (9000012, 9000001, 'Beatriz Moreira (Demo)', '2013-07-22', '$2a$10$.4b7I/cVmm0KDlY0xa5e1er0y32WeigO2SBVftdQNZMls1u/tdaki', 'ALUNO', '2026-11-01 09:00:00', false, true) ON CONFLICT DO NOTHING
@@FIM@@
INSERT INTO aluno (id, matricula, avatar, perfil_completo) VALUES (9000012, 'DEMO0002', 'sabia-laranja', true) ON CONFLICT DO NOTHING
@@FIM@@
INSERT INTO usuario (id, instituicao_id, nome, data_nascimento, senha_hash, tipo_perfil, criado_em, must_change_password, ativo) VALUES (9000013, 9000001, 'Rafael Nogueira (Demo)', '2012-11-02', '$2a$10$lV4kLiEJv9zIpbvamEeVnu0eb4l9plBZSwL6UNEMcQEJxArHAtHdO', 'ALUNO', '2026-11-01 09:00:00', false, true) ON CONFLICT DO NOTHING
@@FIM@@
INSERT INTO aluno (id, matricula, avatar, perfil_completo) VALUES (9000013, 'DEMO0003', 'sabia-verde', true) ON CONFLICT DO NOTHING
@@FIM@@
INSERT INTO usuario (id, instituicao_id, nome, data_nascimento, senha_hash, tipo_perfil, criado_em, must_change_password, ativo) VALUES (9000014, 9000001, 'Camila Ribeiro (Demo)', '2013-01-30', '$2a$10$d3bcVnmwPmoDd9efoVfeRO/m75aqJrmeKVTe6WsnYdWDfQWCjUZSi', 'ALUNO', '2026-11-01 09:00:00', false, true) ON CONFLICT DO NOTHING
@@FIM@@
INSERT INTO aluno (id, matricula, avatar, perfil_completo) VALUES (9000014, 'DEMO0004', 'sabia-roxo', true) ON CONFLICT DO NOTHING
@@FIM@@
INSERT INTO usuario (id, instituicao_id, nome, data_nascimento, senha_hash, tipo_perfil, criado_em, must_change_password, ativo) VALUES (9000015, 9000001, 'Tiago Farias (Demo)', '2012-09-09', '$2a$10$0FI8rE.sVOsnbRKEE795GuNQ/dzyE0t9VWfg2uMTEkcBfFUay1qx2', 'ALUNO', '2026-11-01 09:00:00', true, true) ON CONFLICT DO NOTHING
@@FIM@@
INSERT INTO aluno (id, matricula, avatar, perfil_completo) VALUES (9000015, 'DEMO0005', 'sabia-amarelo', true) ON CONFLICT DO NOTHING
@@FIM@@
INSERT INTO usuario (id, instituicao_id, nome, data_nascimento, senha_hash, tipo_perfil, criado_em, must_change_password, ativo) VALUES (9000016, 9000001, 'Sofia Lacerda (Demo)', '2013-05-18', '$2a$10$6YaxqNNEXLDPr9S09dj6lueJ5DpLquzdCVQBFWgMI65Z.vMNR9BHO', 'ALUNO', '2026-11-01 09:00:00', false, true) ON CONFLICT DO NOTHING
@@FIM@@
INSERT INTO aluno (id, matricula, avatar, perfil_completo) VALUES (9000016, 'DEMO0006', 'sabia-rosa', true) ON CONFLICT DO NOTHING
@@FIM@@
