-- =============================================
-- Ferro Velho Gomes — Schema do Banco de Dados
-- =============================================

-- Tabela de materiais (cadastro base)
CREATE TABLE IF NOT EXISTS material (
  id               SERIAL PRIMARY KEY,
  nome             VARCHAR(100) NOT NULL,
  preco_compra_kg  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  preco_venda_kg   NUMERIC(10, 2) NOT NULL DEFAULT 0,
  estoque_minimo_kg NUMERIC(10, 2) NOT NULL DEFAULT 0,
  criado_em        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de estoque (saldo atual por material)
CREATE TABLE IF NOT EXISTS estoque (
  id_material   INTEGER PRIMARY KEY REFERENCES material(id) ON DELETE CASCADE,
  quantidade_kg NUMERIC(10, 3) NOT NULL DEFAULT 0
);

-- Tabela de compras (entradas de material)
CREATE TABLE IF NOT EXISTS compras (
  id            SERIAL PRIMARY KEY,
  id_material   INTEGER NOT NULL REFERENCES material(id),
  peso_kg       NUMERIC(10, 3) NOT NULL,
  preco_kg      NUMERIC(10, 2) NOT NULL,
  total         NUMERIC(12, 2) GENERATED ALWAYS AS (peso_kg * preco_kg) STORED,
  criado_em     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de vendas (saídas de material)
CREATE TABLE IF NOT EXISTS vendas (
  id            SERIAL PRIMARY KEY,
  id_material   INTEGER NOT NULL REFERENCES material(id),
  peso_kg       NUMERIC(10, 3) NOT NULL,
  preco_kg      NUMERIC(10, 2) NOT NULL,
  total         NUMERIC(12, 2) GENERATED ALWAYS AS (peso_kg * preco_kg) STORED,
  criado_em     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de auditoria (log de ações)
CREATE TABLE IF NOT EXISTS auditoria (
  id          SERIAL PRIMARY KEY,
  acao        VARCHAR(100) NOT NULL,
  descricao   TEXT,
  usuario     VARCHAR(100) DEFAULT 'sistema',
  data_hora   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- Triggers para manter o estoque automaticamente
-- =============================================

CREATE OR REPLACE FUNCTION atualizar_estoque_compra()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO estoque (id_material, quantidade_kg)
    VALUES (NEW.id_material, NEW.peso_kg)
  ON CONFLICT (id_material)
    DO UPDATE SET quantidade_kg = estoque.quantidade_kg + NEW.peso_kg;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_estoque_compra ON compras;
CREATE TRIGGER trig_estoque_compra
  AFTER INSERT ON compras
  FOR EACH ROW EXECUTE FUNCTION atualizar_estoque_compra();

CREATE OR REPLACE FUNCTION atualizar_estoque_venda()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO estoque (id_material, quantidade_kg)
    VALUES (NEW.id_material, -NEW.peso_kg)
  ON CONFLICT (id_material)
    DO UPDATE SET quantidade_kg = GREATEST(0, estoque.quantidade_kg - NEW.peso_kg);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_estoque_venda ON vendas;
CREATE TRIGGER trig_estoque_venda
  AFTER INSERT ON vendas
  FOR EACH ROW EXECUTE FUNCTION atualizar_estoque_venda();

-- Trigger de auditoria para compras
CREATE OR REPLACE FUNCTION audit_compra()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO auditoria (acao, descricao)
    VALUES ('Compra registrada',
      'Material ID ' || NEW.id_material || ' — ' || NEW.peso_kg || ' kg a R$ ' || NEW.preco_kg || '/kg');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_audit_compra ON compras;
CREATE TRIGGER trig_audit_compra
  AFTER INSERT ON compras
  FOR EACH ROW EXECUTE FUNCTION audit_compra();

-- Trigger de auditoria para vendas
CREATE OR REPLACE FUNCTION audit_venda()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO auditoria (acao, descricao)
    VALUES ('Venda registrada',
      'Material ID ' || NEW.id_material || ' — ' || NEW.peso_kg || ' kg a R$ ' || NEW.preco_kg || '/kg');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_audit_venda ON vendas;
CREATE TRIGGER trig_audit_venda
  AFTER INSERT ON vendas
  FOR EACH ROW EXECUTE FUNCTION audit_venda();
