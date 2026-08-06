-- ============================================================================
-- 03_TRIGGERS.sql — Funções e gatilhos
-- ============================================================================
SET search_path TO ferro_velho, public;

-- ------------------------------------------------------------------
-- 1. Atualiza automaticamente a coluna atualizado_em
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_timestamp
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION fn_atualizar_timestamp();

CREATE TRIGGER trg_estoque_timestamp
BEFORE UPDATE ON estoque
FOR EACH ROW
EXECUTE FUNCTION fn_atualizar_timestamp();

-- ------------------------------------------------------------------
-- 2. ENTRADA de estoque ao registrar item de compra
--    (garante que exista uma linha em estoque, soma o peso,
--     grava a movimentação e recalcula o total da compra)
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_entrada_estoque_compra()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO estoque (id_material, quantidade_kg)
    VALUES (NEW.id_material, NEW.peso_kg)
    ON CONFLICT (id_material)
    DO UPDATE SET quantidade_kg = estoque.quantidade_kg + NEW.peso_kg,
                  atualizado_em = now();

    INSERT INTO movimentacoes_estoque
        (id_material, tipo, quantidade_kg, origem, id_referencia, id_usuario, observacao)
    SELECT NEW.id_material, 'ENTRADA', NEW.peso_kg, 'COMPRA', NEW.id_compra,
           c.id_usuario, 'Entrada automática via item de compra #' || NEW.id_item_compra
    FROM compras c
    WHERE c.id_compra = NEW.id_compra;

    UPDATE compras
    SET valor_total = (
        SELECT COALESCE(SUM(subtotal), 0) FROM itens_compra WHERE id_compra = NEW.id_compra
    )
    WHERE id_compra = NEW.id_compra;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_itens_compra_after_insert
AFTER INSERT ON itens_compra
FOR EACH ROW
EXECUTE FUNCTION fn_entrada_estoque_compra();

-- ------------------------------------------------------------------
-- 3. SAÍDA de estoque ao registrar item de venda
--    Valida saldo suficiente ANTES de inserir (BEFORE INSERT).
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_valida_saida_estoque_venda()
RETURNS TRIGGER AS $$
DECLARE
    v_saldo_atual NUMERIC(12,2);
    v_nome_material VARCHAR(120);
BEGIN
    SELECT quantidade_kg INTO v_saldo_atual
    FROM estoque
    WHERE id_material = NEW.id_material
    FOR UPDATE;

    IF v_saldo_atual IS NULL THEN
        v_saldo_atual := 0;
    END IF;

    IF v_saldo_atual < NEW.peso_kg THEN
        SELECT nome INTO v_nome_material FROM materiais WHERE id_material = NEW.id_material;
        RAISE EXCEPTION 'Saldo insuficiente de "%": estoque atual % kg, solicitado % kg',
            v_nome_material, v_saldo_atual, NEW.peso_kg;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_itens_venda_before_insert
BEFORE INSERT ON itens_venda
FOR EACH ROW
EXECUTE FUNCTION fn_valida_saida_estoque_venda();

CREATE OR REPLACE FUNCTION fn_saida_estoque_venda()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE estoque
    SET quantidade_kg = quantidade_kg - NEW.peso_kg,
        atualizado_em = now()
    WHERE id_material = NEW.id_material;

    INSERT INTO movimentacoes_estoque
        (id_material, tipo, quantidade_kg, origem, id_referencia, id_usuario, observacao)
    SELECT NEW.id_material, 'SAIDA', NEW.peso_kg, 'VENDA', NEW.id_venda,
           v.id_usuario, 'Saída automática via item de venda #' || NEW.id_item_venda
    FROM vendas v
    WHERE v.id_venda = NEW.id_venda;

    UPDATE vendas
    SET valor_total = (
        SELECT COALESCE(SUM(subtotal), 0) FROM itens_venda WHERE id_venda = NEW.id_venda
    )
    WHERE id_venda = NEW.id_venda;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_itens_venda_after_insert
AFTER INSERT ON itens_venda
FOR EACH ROW
EXECUTE FUNCTION fn_saida_estoque_venda();

-- ------------------------------------------------------------------
-- 4. AUDITORIA genérica (INSERT/UPDATE/DELETE) para tabelas sensíveis
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_auditoria()
RETURNS TRIGGER AS $$
DECLARE
    v_id_registro INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_id_registro := (row_to_json(OLD)->>(TG_ARGV[0]))::INT;
        INSERT INTO auditoria (tabela, operacao, id_registro, dados_antigos, dados_novos)
        VALUES (TG_TABLE_NAME, TG_OP, v_id_registro, row_to_json(OLD)::JSONB, NULL);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        v_id_registro := (row_to_json(NEW)->>(TG_ARGV[0]))::INT;
        INSERT INTO auditoria (tabela, operacao, id_registro, dados_antigos, dados_novos)
        VALUES (TG_TABLE_NAME, TG_OP, v_id_registro, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);
        RETURN NEW;
    ELSE -- INSERT
        v_id_registro := (row_to_json(NEW)->>(TG_ARGV[0]))::INT;
        INSERT INTO auditoria (tabela, operacao, id_registro, dados_antigos, dados_novos)
        VALUES (TG_TABLE_NAME, TG_OP, v_id_registro, NULL, row_to_json(NEW)::JSONB);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auditoria_materiais
AFTER INSERT OR UPDATE OR DELETE ON materiais
FOR EACH ROW EXECUTE FUNCTION fn_auditoria('id_material');

CREATE TRIGGER trg_auditoria_clientes
AFTER INSERT OR UPDATE OR DELETE ON clientes
FOR EACH ROW EXECUTE FUNCTION fn_auditoria('id_cliente');

CREATE TRIGGER trg_auditoria_fornecedores
AFTER INSERT OR UPDATE OR DELETE ON fornecedores
FOR EACH ROW EXECUTE FUNCTION fn_auditoria('id_fornecedor');

CREATE TRIGGER trg_auditoria_usuarios
AFTER INSERT OR UPDATE OR DELETE ON usuarios
FOR EACH ROW EXECUTE FUNCTION fn_auditoria('id_usuario');

CREATE TRIGGER trg_auditoria_estoque
AFTER UPDATE ON estoque
FOR EACH ROW EXECUTE FUNCTION fn_auditoria('id_estoque');
