-- ================================================================
-- 03-limpeza-colunas.sql — limpeza do modelo (Nível 1)
-- Rodar SÓ DEPOIS de validar o sistema com o código novo (ex.: 24 h). IRREVERSÍVEL sem backup:
-- faça pg_dump antes.
--
--   psql -v ON_ERROR_STOP=1 -U <usuario> -d <banco> -f 03-limpeza-colunas.sql
--
-- Remove as colunas órfãs (já não mapeadas pelas entidades). Idempotente (IF EXISTS).
-- Antes de cada DROP há um SELECT de conferência em comentário: rode-o e confirme o que será perdido.
-- ================================================================
BEGIN;

-- X1 · auth.aluno.pontuacao_geral
-- SELECT count(*) AS linhas, count(*) FILTER (WHERE pontuacao_geral <> 0) AS com_valor_diferente_de_zero FROM auth.aluno;
ALTER TABLE IF EXISTS auth.aluno DROP COLUMN IF EXISTS pontuacao_geral;

-- X6 · auth.professor.especialidade
-- SELECT count(*) AS preenchidas FROM auth.professor WHERE especialidade IS NOT NULL;
ALTER TABLE IF EXISTS auth.professor DROP COLUMN IF EXISTS especialidade;

-- X7 · pedagogico.turma.instituicao_id
-- SELECT count(*) AS preenchidas FROM pedagogico.turma WHERE instituicao_id IS NOT NULL;
ALTER TABLE IF EXISTS pedagogico.turma DROP COLUMN IF EXISTS instituicao_id;

-- X3 · pedagogico.licao.conteudo, video_id, video_titulo, video_canal
-- SELECT count(*) FILTER (WHERE conteudo IS NOT NULL)     AS conteudo,
--        count(*) FILTER (WHERE video_id IS NOT NULL)     AS video_id,
--        count(*) FILTER (WHERE video_titulo IS NOT NULL) AS video_titulo,
--        count(*) FILTER (WHERE video_canal IS NOT NULL)  AS video_canal
--   FROM pedagogico.licao;
ALTER TABLE IF EXISTS pedagogico.licao
    DROP COLUMN IF EXISTS conteudo,
    DROP COLUMN IF EXISTS video_id,
    DROP COLUMN IF EXISTS video_titulo,
    DROP COLUMN IF EXISTS video_canal;

-- X4 · pedagogico.licao.codigo e ordem (o UNIQUE de codigo some junto com a coluna)
-- SELECT count(*) AS licoes, count(DISTINCT codigo) AS codigos_distintos, max(ordem) AS maior_ordem FROM pedagogico.licao;
ALTER TABLE IF EXISTS pedagogico.licao
    DROP COLUMN IF EXISTS codigo,
    DROP COLUMN IF EXISTS ordem;

-- X5 · pedagogico.progresso_licao.video_visto
-- SELECT count(*) FILTER (WHERE video_visto) AS marcados_como_visto FROM pedagogico.progresso_licao;
ALTER TABLE IF EXISTS pedagogico.progresso_licao DROP COLUMN IF EXISTS video_visto;

-- X8 · pedagogico.atividade_avaliativa.e_gerada_ia
-- SELECT count(*) FILTER (WHERE e_gerada_ia) AS atividades_marcadas_como_geradas_por_ia FROM pedagogico.atividade_avaliativa;
ALTER TABLE IF EXISTS pedagogico.atividade_avaliativa DROP COLUMN IF EXISTS e_gerada_ia;

-- X9 · pedagogico.correcao.relatorio_ia_json
-- ATENÇÃO: o DROP perde este histórico. O front passou a ler só submissao_avaliativa.relatorio_ia_pre_gerado_json.
-- Correções que ainda têm dado nesta coluna E cuja submissão não tem o relatório pré-gerado (esse histórico
-- seria perdido; se > 0, copie antes: UPDATE ... SET relatorio_ia_pre_gerado_json = c.relatorio_ia_json ...):
-- SELECT count(*) AS correcoes_que_perderiam_relatorio
--   FROM pedagogico.correcao c
--   JOIN pedagogico.submissao_avaliativa s ON s.id = c.submissao_id
--  WHERE c.relatorio_ia_json IS NOT NULL AND s.relatorio_ia_pre_gerado_json IS NULL;
-- SELECT count(*) AS total_com_dado FROM pedagogico.correcao WHERE relatorio_ia_json IS NOT NULL;
ALTER TABLE IF EXISTS pedagogico.correcao DROP COLUMN IF EXISTS relatorio_ia_json;

COMMIT;
