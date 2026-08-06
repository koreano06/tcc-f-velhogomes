-- ============================================================================
-- 05_PROCEDURES.sql — Stored Procedures e Functions de negócio
-- ============================================================================
SET search_path TO ferro_velho, public;

-- ------------------------------------------------------------------
-- 1. Registrar uma compra completa (cabeçalho + itens) em uma única
--    transação atômica. Itens em formato JSONB:
--    [{"id_material":1,"peso_kg":100,"preco_kg":8.5}, ...]
-- ------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_registrar_compra(
    p_id_fornecedor INT,
    p_id_usuario    INT,
    p_itens         JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_compra INT;
    v_item      JSONB;
BEGIN
    INSERT INTO compras (id_fornecedor, id_usuario, valor_total)
    VALUES (p_id_fornecedor, p_id_usuario, 0)
    RETURNING id_compra INTO v_id_compra;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
    LOOP
        INSERT INTO itens_compra (id_compra, id_material, peso_kg, preco_kg)
        VALUES (
            v_id_compra,
            (v_item->>'id_material')::INT,
            (v_item->>'peso_kg')::NUMERIC,
            (v_item->>'preco_kg')::NUMERIC
        );
    END LOOP;

    RAISE NOTICE 'Compra #% registrada com sucesso.', v_id_compra;
END;
$$;

-- ------------------------------------------------------------------
-- 2. Registrar uma venda completa (cabeçalho + itens).
--    Se algum item não tiver saldo em estoque, a trigger de validação
--    lança exceção e TODA a transação é revertida automaticamente.
-- ------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_registrar_venda(
    p_id_cliente INT,
    p_id_usuario INT,
    p_itens      JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_venda INT;
    v_item     JSONB;
BEGIN
    INSERT INTO vendas (id_cliente, id_usuario, valor_total)
    VALUES (p_id_cliente, p_id_usuario, 0)
    RETURNING id_venda INTO v_id_venda;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
    LOOP
        INSERT INTO itens_venda (id_venda, id_material, peso_kg, preco_kg)
        VALUES (
            v_id_venda,
            (v_item->>'id_material')::INT,
            (v_item->>'peso_kg')::NUMERIC,
            (v_item->>'preco_kg')::NUMERIC
        );
    END LOOP;

    RAISE NOTICE 'Venda #% registrada com sucesso.', v_id_venda;
END;
$$;

-- ------------------------------------------------------------------
-- 3. Ajuste manual de estoque (inventário, perdas, correções)
-- ------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_ajustar_estoque(
    p_id_material INT,
    p_nova_quantidade NUMERIC,
    p_id_usuario INT,
    p_motivo VARCHAR DEFAULT 'Ajuste manual de inventário'
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_quantidade_atual NUMERIC(12,2);
    v_diferenca NUMERIC(12,2);
BEGIN
    SELECT quantidade_kg INTO v_quantidade_atual
    FROM estoque WHERE id_material = p_id_material
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO estoque (id_material, quantidade_kg) VALUES (p_id_material, p_nova_quantidade);
        v_diferenca := p_nova_quantidade;
    ELSE
        v_diferenca := p_nova_quantidade - v_quantidade_atual;
        UPDATE estoque
        SET quantidade_kg = p_nova_quantidade, atualizado_em = now()
        WHERE id_material = p_id_material;
    END IF;

    IF v_diferenca <> 0 THEN
        INSERT INTO movimentacoes_estoque
            (id_material, tipo, quantidade_kg, origem, id_usuario, observacao)
        VALUES (
            p_id_material, 'AJUSTE', ABS(v_diferenca), 'AJUSTE_MANUAL', p_id_usuario, p_motivo
        );
    END IF;
END;
$$;

-- ------------------------------------------------------------------
-- 4. Function: relatório de faturamento (vendas - compras) em um período
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_relatorio_periodo(
    p_data_inicio DATE,
    p_data_fim    DATE
)
RETURNS TABLE (
    total_compras     NUMERIC,
    total_vendas      NUMERIC,
    resultado_bruto   NUMERIC
)
LANGUAGE sql
AS $$
    SELECT
        COALESCE((SELECT SUM(valor_total) FROM compras
                   WHERE status = 'CONCLUIDA'
                   AND data_compra::date BETWEEN p_data_inicio AND p_data_fim), 0) AS total_compras,
        COALESCE((SELECT SUM(valor_total) FROM vendas
                   WHERE status = 'CONCLUIDA'
                   AND data_venda::date BETWEEN p_data_inicio AND p_data_fim), 0) AS total_vendas,
        COALESCE((SELECT SUM(valor_total) FROM vendas
                   WHERE status = 'CONCLUIDA'
                   AND data_venda::date BETWEEN p_data_inicio AND p_data_fim), 0)
        -
        COALESCE((SELECT SUM(valor_total) FROM compras
                   WHERE status = 'CONCLUIDA'
                   AND data_compra::date BETWEEN p_data_inicio AND p_data_fim), 0) AS resultado_bruto;
$$;

-- ------------------------------------------------------------------
-- 5. Function utilitária: hash de senha (usada no DML/aplicação)
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_hash_senha(p_senha TEXT)
RETURNS VARCHAR
LANGUAGE sql
AS $$
    SELECT crypt(p_senha, gen_salt('bf'));
$$;
