-- ============================================================================
-- 00_INSTALAR_TUDO.sql
-- Executa a instalação completa do banco, na ordem correta.
--
-- Uso:
--   createdb ferro_velho_db
--   psql -U seu_usuario -d ferro_velho_db -f 00_instalar_tudo.sql
-- ============================================================================
\echo 'Criando estrutura (DDL)...'
\i 01_ddl.sql

\echo 'Criando índices...'
\i 02_indices.sql

\echo 'Criando triggers e funções de gatilho...'
\i 03_triggers.sql

\echo 'Criando views...'
\i 04_views.sql

\echo 'Criando procedures e functions de negócio...'
\i 05_procedures.sql

\echo 'Carregando dados iniciais (DML)...'
\i 06_dml.sql

\echo 'Aplicando roles e permissões (DCL)...'
\i 07_dcl.sql

\echo 'Instalação concluída com sucesso.'
