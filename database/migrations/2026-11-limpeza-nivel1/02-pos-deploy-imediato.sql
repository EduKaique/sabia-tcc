-- ================================================================
-- 02-pos-deploy-imediato.sql — limpeza do modelo (Nível 1)
-- Rodar LOGO DEPOIS de subir o código novo (R5: ModoProjetoSandbox → ModoPratica).
--
--   psql -v ON_ERROR_STOP=1 -U <usuario> -d <banco> -f 02-pos-deploy-imediato.sql
--
-- Enquanto este script não roda, o código novo falha ao LER projetos do sandbox gravados com
-- BLOCOS_LIVRES/ROBO (valor de enum desconhecido). Rodar sem demora. Idempotente.
-- Não apaga coluna nem tabela: converte dados e troca o CHECK (DROP CONSTRAINT + ADD CONSTRAINT).
-- ================================================================
BEGIN;

UPDATE pedagogico.projeto_sandbox SET modo = 'BLOCOS'    WHERE modo = 'BLOCOS_LIVRES';
UPDATE pedagogico.projeto_sandbox SET modo = 'JOGO_ROBO' WHERE modo = 'ROBO';

DO $$
DECLARE
    nome text;
BEGIN
    FOR nome IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'pedagogico.projeto_sandbox'::regclass AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%modo%'
    LOOP
        EXECUTE format('ALTER TABLE pedagogico.projeto_sandbox DROP CONSTRAINT %I', nome);
    END LOOP;
    ALTER TABLE pedagogico.projeto_sandbox
        ADD CONSTRAINT projeto_sandbox_modo_check
        CHECK (modo IN ('BLOCOS', 'JOGO_ROBO'));
END $$;

COMMIT;
