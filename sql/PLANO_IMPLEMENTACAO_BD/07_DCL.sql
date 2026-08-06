-- ============================================================================
-- 07_DCL.sql — Data Control Language (roles e permissões)
-- ============================================================================
SET search_path TO ferro_velho, public;

-- ------------------------------------------------------------------
-- 1. ROLES da aplicação
-- ------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'role_admin') THEN
        CREATE ROLE role_admin NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'role_operador') THEN
        CREATE ROLE role_operador NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'role_leitura') THEN
        CREATE ROLE role_leitura NOLOGIN;
    END IF;
END $$;

-- ------------------------------------------------------------------
-- 2. USUÁRIOS DE LOGIN (contas de serviço da aplicação)
--    Troque as senhas antes de usar em produção.
-- ------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_admin') THEN
        CREATE ROLE app_admin LOGIN PASSWORD 'troque_esta_senha_admin' IN ROLE role_admin;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_operador') THEN
        CREATE ROLE app_operador LOGIN PASSWORD 'troque_esta_senha_operador' IN ROLE role_operador;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_leitura') THEN
        CREATE ROLE app_leitura LOGIN PASSWORD 'troque_esta_senha_leitura' IN ROLE role_leitura;
    END IF;
END $$;

GRANT USAGE ON SCHEMA ferro_velho TO role_admin, role_operador, role_leitura;

-- ------------------------------------------------------------------
-- 3. ROLE_ADMIN — acesso total (DDL/DML) dentro do schema
-- ------------------------------------------------------------------
GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA ferro_velho TO role_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ferro_velho TO role_admin;
GRANT EXECUTE ON ALL FUNCTIONS  IN SCHEMA ferro_velho TO role_admin;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA ferro_velho TO role_admin;

-- ------------------------------------------------------------------
-- 4. ROLE_OPERADOR — opera o dia a dia (compra/venda/estoque),
--    sem poder apagar cadastros nem ver tabelas de auditoria/log
-- ------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON
    clientes, fornecedores, materiais, categorias, estoque,
    compras, itens_compra, vendas, itens_venda, movimentacoes_estoque
    TO role_operador;

GRANT SELECT ON usuarios, perfis TO role_operador;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ferro_velho TO role_operador;

GRANT EXECUTE ON PROCEDURE sp_registrar_compra(INT, INT, JSONB)   TO role_operador;
GRANT EXECUTE ON PROCEDURE sp_registrar_venda(INT, INT, JSONB)    TO role_operador;
GRANT EXECUTE ON PROCEDURE sp_ajustar_estoque(INT, NUMERIC, INT, VARCHAR) TO role_operador;
GRANT EXECUTE ON FUNCTION fn_relatorio_periodo(DATE, DATE) TO role_operador;

-- Todas as views ficam liberadas para leitura ao operador
GRANT SELECT ON
    vw_estoque_atual, vw_compras_por_fornecedor, vw_vendas_por_cliente,
    vw_materiais_mais_vendidos, vw_movimentacoes_recentes,
    vw_faturamento_diario, vw_usuarios_perfis, vw_margem_materiais
    TO role_operador;

-- ------------------------------------------------------------------
-- 5. ROLE_LEITURA — somente consulta (relatórios/BI), sem dados de senha
-- ------------------------------------------------------------------
GRANT SELECT ON
    clientes, fornecedores, materiais, categorias, estoque,
    compras, itens_compra, vendas, itens_venda, movimentacoes_estoque
    TO role_leitura;

GRANT SELECT ON
    vw_estoque_atual, vw_compras_por_fornecedor, vw_vendas_por_cliente,
    vw_materiais_mais_vendidos, vw_movimentacoes_recentes,
    vw_faturamento_diario, vw_margem_materiais
    TO role_leitura;

GRANT EXECUTE ON FUNCTION fn_relatorio_periodo(DATE, DATE) TO role_leitura;

-- Nunca conceder acesso a usuarios.senha_hash, auditoria ou logs para leitura externa
REVOKE ALL ON usuarios, auditoria, logs FROM role_leitura, role_operador;

-- ------------------------------------------------------------------
-- 6. Privilégios padrão para objetos futuros criados por role_admin
-- ------------------------------------------------------------------
ALTER DEFAULT PRIVILEGES FOR ROLE role_admin IN SCHEMA ferro_velho
    GRANT SELECT, INSERT, UPDATE ON TABLES TO role_operador;

ALTER DEFAULT PRIVILEGES FOR ROLE role_admin IN SCHEMA ferro_velho
    GRANT SELECT ON TABLES TO role_leitura;
