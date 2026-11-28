-- ================================================================
-- 01-pre-deploy.sql — limpeza do modelo (Nível 1)
-- Rodar ANTES de subir o código novo. Compatível com o código antigo e com o novo.
--
--   psql -v ON_ERROR_STOP=1 -U <usuario> -d <banco> -f 01-pre-deploy.sql
--
-- Idempotente. Não apaga coluna nem dado: só relaxa NOT NULL (para o INSERT do código novo, que não
-- preenche mais essas colunas) e amplia o CHECK de projeto_sandbox.modo para aceitar os valores
-- antigos e os novos. Trocar um CHECK exige DROP CONSTRAINT + ADD CONSTRAINT na mesma transação.
-- O UNIQUE de licao.codigo permanece: no Postgres ele aceita vários nulos.
-- ================================================================
BEGIN;

-- Relaxa NOT NULL só se a coluna ainda existir (ela some depois do 03).
DO $$
DECLARE
    alvo text[];
    alvos text[][] := ARRAY[
        ['auth',      'aluno',                'pontuacao_geral'],   -- X1
        ['pedagogico','licao',                'codigo'],            -- X4 (UNIQUE passa a aceitar nulos)
        ['pedagogico','licao',                'ordem'],             -- X4
        ['pedagogico','progresso_licao',      'video_visto'],       -- X5
        ['pedagogico','atividade_avaliativa', 'e_gerada_ia']        -- X8
    ];
BEGIN
    FOREACH alvo SLICE 1 IN ARRAY alvos LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = alvo[1] AND table_name = alvo[2] AND column_name = alvo[3]
                     AND is_nullable = 'NO') THEN
            EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I DROP NOT NULL', alvo[1], alvo[2], alvo[3]);
            RAISE NOTICE 'NOT NULL removido de %.%.%', alvo[1], alvo[2], alvo[3];
        END IF;
    END LOOP;
END $$;

-- R5: o CHECK de projeto_sandbox.modo passa a aceitar os valores antigos (BLOCOS_LIVRES, ROBO) e os novos
-- (BLOCOS, JOGO_ROBO). O nome do CHECK gerado pelo Hibernate é lido do catálogo.
DO $$
DECLARE
    nome text;
BEGIN
    IF to_regclass('pedagogico.projeto_sandbox') IS NULL THEN
        RAISE NOTICE 'pedagogico.projeto_sandbox não existe; nada a ampliar';
        RETURN;
    END IF;
    FOR nome IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'pedagogico.projeto_sandbox'::regclass AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%modo%'
    LOOP
        EXECUTE format('ALTER TABLE pedagogico.projeto_sandbox DROP CONSTRAINT %I', nome);
    END LOOP;
    ALTER TABLE pedagogico.projeto_sandbox
        ADD CONSTRAINT projeto_sandbox_modo_check
        CHECK (modo IN ('BLOCOS_LIVRES', 'ROBO', 'BLOCOS', 'JOGO_ROBO'));
END $$;

COMMIT;
