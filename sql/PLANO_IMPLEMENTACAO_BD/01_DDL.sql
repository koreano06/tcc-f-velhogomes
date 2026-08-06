-- ============================================================================
-- SISTEMA DE GESTÃO PARA FERRO-VELHO / RECICLAGEM DE METAIS
-- 01_DDL.sql — Data Definition Language
-- SGBD: PostgreSQL 16
-- ============================================================================

-- ------------------------------------------------------------------
-- 0. BANCO E EXTENSÕES
-- ------------------------------------------------------------------
-- Execute como superusuário, fora de uma transação:
-- CREATE DATABASE ferro_velho_db
--     WITH ENCODING = 'UTF8'
--     LC_COLLATE = 'pt_BR.UTF-8'
--     LC_CTYPE   = 'pt_BR.UTF-8'
--     TEMPLATE = template0;
--
-- \c ferro_velho_db

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- hashing de senha (crypt/gen_salt)
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- índices de busca textual (LIKE / ILIKE)

CREATE SCHEMA IF NOT EXISTS ferro_velho;
SET search_path TO ferro_velho, public;

-- ------------------------------------------------------------------
-- 1. PERFIS (perfis de acesso do sistema)
-- ------------------------------------------------------------------
CREATE TABLE perfis (
    id_perfil     SERIAL PRIMARY KEY,
    nome          VARCHAR(50)  NOT NULL,
    descricao     VARCHAR(255),
    criado_em     TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uq_perfis_nome UNIQUE (nome)
);

-- ------------------------------------------------------------------
-- 2. USUARIOS (operadores do sistema)
-- ------------------------------------------------------------------
CREATE TABLE usuarios (
    id_usuario     SERIAL PRIMARY KEY,
    nome           VARCHAR(150) NOT NULL,
    email          VARCHAR(150) NOT NULL,
    senha_hash     VARCHAR(255) NOT NULL,
    id_perfil      INT          NOT NULL,
    ativo          BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em      TIMESTAMP    NOT NULL DEFAULT now(),
    atualizado_em  TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT fk_usuarios_perfil FOREIGN KEY (id_perfil)
        REFERENCES perfis (id_perfil) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_usuarios_email_formato CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ------------------------------------------------------------------
-- 3. CLIENTES
-- ------------------------------------------------------------------
CREATE TABLE clientes (
    id_cliente    SERIAL PRIMARY KEY,
    nome          VARCHAR(150) NOT NULL,
    documento     VARCHAR(20),          -- CPF ou CNPJ
    telefone      VARCHAR(20),
    email         VARCHAR(150),
    endereco      VARCHAR(255),
    ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em     TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uq_clientes_documento UNIQUE (documento)
);

-- ------------------------------------------------------------------
-- 4. FORNECEDORES
-- ------------------------------------------------------------------
CREATE TABLE fornecedores (
    id_fornecedor SERIAL PRIMARY KEY,
    nome          VARCHAR(150) NOT NULL,
    documento     VARCHAR(20),
    telefone      VARCHAR(20),
    email         VARCHAR(150),
    endereco      VARCHAR(255),
    ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em     TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uq_fornecedores_documento UNIQUE (documento)
);

-- ------------------------------------------------------------------
-- 5. CATEGORIAS (classificação dos materiais: ferrosos, não ferrosos...)
-- ------------------------------------------------------------------
CREATE TABLE categorias (
    id_categoria  SERIAL PRIMARY KEY,
    nome          VARCHAR(80)  NOT NULL,
    descricao     VARCHAR(255),
    CONSTRAINT uq_categorias_nome UNIQUE (nome)
);

-- ------------------------------------------------------------------
-- 6. MATERIAIS
-- ------------------------------------------------------------------
CREATE TABLE materiais (
    id_material      SERIAL PRIMARY KEY,
    nome             VARCHAR(120) NOT NULL,
    id_categoria     INT,
    unidade_medida   VARCHAR(10)  NOT NULL DEFAULT 'kg',
    preco_compra_kg  NUMERIC(10,2) NOT NULL,
    preco_venda_kg   NUMERIC(10,2) NOT NULL,
    ativo            BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em        TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uq_materiais_nome UNIQUE (nome),
    CONSTRAINT fk_materiais_categoria FOREIGN KEY (id_categoria)
        REFERENCES categorias (id_categoria) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT ck_materiais_preco_compra CHECK (preco_compra_kg >= 0),
    CONSTRAINT ck_materiais_preco_venda  CHECK (preco_venda_kg  >= 0)
);

-- ------------------------------------------------------------------
-- 7. ESTOQUE (1:1 com material)
-- ------------------------------------------------------------------
CREATE TABLE estoque (
    id_estoque      SERIAL PRIMARY KEY,
    id_material     INT       NOT NULL,
    quantidade_kg   NUMERIC(12,2) NOT NULL DEFAULT 0,
    atualizado_em   TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_estoque_material UNIQUE (id_material),
    CONSTRAINT fk_estoque_material FOREIGN KEY (id_material)
        REFERENCES materiais (id_material) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT ck_estoque_quantidade CHECK (quantidade_kg >= 0)
);

-- ------------------------------------------------------------------
-- 8. COMPRAS (cabeçalho)
-- ------------------------------------------------------------------
CREATE TABLE compras (
    id_compra      SERIAL PRIMARY KEY,
    id_fornecedor  INT       NOT NULL,
    id_usuario     INT       NOT NULL,
    data_compra    TIMESTAMP NOT NULL DEFAULT now(),
    valor_total    NUMERIC(12,2) NOT NULL DEFAULT 0,
    status         VARCHAR(20) NOT NULL DEFAULT 'CONCLUIDA',
    criado_em      TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT fk_compras_fornecedor FOREIGN KEY (id_fornecedor)
        REFERENCES fornecedores (id_fornecedor) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_compras_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuarios (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_compras_valor_total CHECK (valor_total >= 0),
    CONSTRAINT ck_compras_status CHECK (status IN ('CONCLUIDA', 'CANCELADA'))
);

-- ------------------------------------------------------------------
-- 9. ITENS_COMPRA
-- ------------------------------------------------------------------
CREATE TABLE itens_compra (
    id_item_compra  SERIAL PRIMARY KEY,
    id_compra       INT NOT NULL,
    id_material     INT NOT NULL,
    peso_kg         NUMERIC(10,2) NOT NULL,
    preco_kg        NUMERIC(10,2) NOT NULL,
    subtotal        NUMERIC(12,2) GENERATED ALWAYS AS (peso_kg * preco_kg) STORED,
    CONSTRAINT fk_itens_compra_compra FOREIGN KEY (id_compra)
        REFERENCES compras (id_compra) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_itens_compra_material FOREIGN KEY (id_material)
        REFERENCES materiais (id_material) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_itens_compra_peso CHECK (peso_kg > 0),
    CONSTRAINT ck_itens_compra_preco CHECK (preco_kg >= 0)
);

-- ------------------------------------------------------------------
-- 10. VENDAS (cabeçalho)
-- ------------------------------------------------------------------
CREATE TABLE vendas (
    id_venda      SERIAL PRIMARY KEY,
    id_cliente    INT       NOT NULL,
    id_usuario    INT       NOT NULL,
    data_venda    TIMESTAMP NOT NULL DEFAULT now(),
    valor_total   NUMERIC(12,2) NOT NULL DEFAULT 0,
    status        VARCHAR(20) NOT NULL DEFAULT 'CONCLUIDA',
    criado_em     TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT fk_vendas_cliente FOREIGN KEY (id_cliente)
        REFERENCES clientes (id_cliente) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_vendas_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuarios (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_vendas_valor_total CHECK (valor_total >= 0),
    CONSTRAINT ck_vendas_status CHECK (status IN ('CONCLUIDA', 'CANCELADA'))
);

-- ------------------------------------------------------------------
-- 11. ITENS_VENDA
-- ------------------------------------------------------------------
CREATE TABLE itens_venda (
    id_item_venda  SERIAL PRIMARY KEY,
    id_venda       INT NOT NULL,
    id_material    INT NOT NULL,
    peso_kg        NUMERIC(10,2) NOT NULL,
    preco_kg       NUMERIC(10,2) NOT NULL,
    subtotal       NUMERIC(12,2) GENERATED ALWAYS AS (peso_kg * preco_kg) STORED,
    CONSTRAINT fk_itens_venda_venda FOREIGN KEY (id_venda)
        REFERENCES vendas (id_venda) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_itens_venda_material FOREIGN KEY (id_material)
        REFERENCES materiais (id_material) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_itens_venda_peso CHECK (peso_kg > 0),
    CONSTRAINT ck_itens_venda_preco CHECK (preco_kg >= 0)
);

-- ------------------------------------------------------------------
-- 12. MOVIMENTACOES_ESTOQUE (kardex / histórico de entrada e saída)
-- ------------------------------------------------------------------
CREATE TABLE movimentacoes_estoque (
    id_movimentacao   SERIAL PRIMARY KEY,
    id_material       INT NOT NULL,
    tipo              VARCHAR(10) NOT NULL,      -- ENTRADA / SAIDA / AJUSTE
    quantidade_kg     NUMERIC(12,2) NOT NULL,
    origem            VARCHAR(20) NOT NULL,      -- COMPRA / VENDA / AJUSTE_MANUAL
    id_referencia      INT,                       -- id_compra, id_venda, etc.
    id_usuario        INT,
    data_movimentacao TIMESTAMP NOT NULL DEFAULT now(),
    observacao        VARCHAR(255),
    CONSTRAINT fk_mov_material FOREIGN KEY (id_material)
        REFERENCES materiais (id_material) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_mov_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuarios (id_usuario) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT ck_mov_tipo CHECK (tipo IN ('ENTRADA', 'SAIDA', 'AJUSTE')),
    CONSTRAINT ck_mov_origem CHECK (origem IN ('COMPRA', 'VENDA', 'AJUSTE_MANUAL')),
    CONSTRAINT ck_mov_quantidade CHECK (quantidade_kg > 0)
);

-- ------------------------------------------------------------------
-- 13. AUDITORIA (trilha de alterações em tabelas sensíveis)
-- ------------------------------------------------------------------
CREATE TABLE auditoria (
    id_auditoria   BIGSERIAL PRIMARY KEY,
    tabela         VARCHAR(50) NOT NULL,
    operacao       VARCHAR(10) NOT NULL,
    id_registro    INT,
    dados_antigos  JSONB,
    dados_novos    JSONB,
    id_usuario     INT,
    data_hora      TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT ck_auditoria_operacao CHECK (operacao IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- ------------------------------------------------------------------
-- 14. LOGS (log técnico da aplicação)
-- ------------------------------------------------------------------
CREATE TABLE logs (
    id_log      BIGSERIAL PRIMARY KEY,
    nivel       VARCHAR(10) NOT NULL,
    mensagem    TEXT        NOT NULL,
    contexto    JSONB,
    criado_em   TIMESTAMP   NOT NULL DEFAULT now(),
    CONSTRAINT ck_logs_nivel CHECK (nivel IN ('DEBUG', 'INFO', 'WARNING', 'ERROR'))
);
