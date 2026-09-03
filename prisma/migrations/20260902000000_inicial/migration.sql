CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ferro_velho";

-- CreateEnum
CREATE TYPE "ferro_velho"."SituacaoOperacao" AS ENUM ('CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "ferro_velho"."UnidadeMedida" AS ENUM ('KG');

-- CreateEnum
CREATE TYPE "ferro_velho"."TipoMovimentacao" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "ferro_velho"."OrigemMovimentacao" AS ENUM ('COMPRA', 'VENDA', 'AJUSTE_MANUAL');

-- CreateEnum
CREATE TYPE "ferro_velho"."NivelLog" AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR');

-- CreateTable
CREATE TABLE "ferro_velho"."auditoria" (
    "id_auditoria" BIGSERIAL NOT NULL,
    "tabela" VARCHAR(50) NOT NULL,
    "operacao" VARCHAR(10) NOT NULL,
    "id_registro" INTEGER,
    "dados_antigos" JSONB,
    "dados_novos" JSONB,
    "id_usuario" INTEGER,
    "data_hora" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id_auditoria")
);

-- CreateTable
CREATE TABLE "ferro_velho"."categorias" (
    "id_categoria" SERIAL NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "descricao" VARCHAR(255),

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "ferro_velho"."clientes" (
    "id_cliente" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "documento" VARCHAR(20),
    "telefone" VARCHAR(20),
    "email" VARCHAR(150),
    "endereco" VARCHAR(255),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "ferro_velho"."compras" (
    "id_compra" SERIAL NOT NULL,
    "id_fornecedor" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "data_compra" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "ferro_velho"."SituacaoOperacao" NOT NULL DEFAULT 'CONCLUIDA',
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id_compra")
);

-- CreateTable
CREATE TABLE "ferro_velho"."estoque" (
    "id_estoque" SERIAL NOT NULL,
    "id_material" INTEGER NOT NULL,
    "quantidade_kg" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estoque_pkey" PRIMARY KEY ("id_estoque")
);

-- CreateTable
CREATE TABLE "ferro_velho"."fornecedores" (
    "id_fornecedor" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "documento" VARCHAR(20),
    "telefone" VARCHAR(20),
    "email" VARCHAR(150),
    "endereco" VARCHAR(255),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id_fornecedor")
);

-- CreateTable
CREATE TABLE "ferro_velho"."itens_compra" (
    "id_item_compra" SERIAL NOT NULL,
    "id_compra" INTEGER NOT NULL,
    "id_material" INTEGER NOT NULL,
    "peso_kg" DECIMAL(10,2) NOT NULL,
    "preco_kg" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(12,2) DEFAULT (peso_kg * preco_kg),

    CONSTRAINT "itens_compra_pkey" PRIMARY KEY ("id_item_compra")
);

-- CreateTable
CREATE TABLE "ferro_velho"."itens_venda" (
    "id_item_venda" SERIAL NOT NULL,
    "id_venda" INTEGER NOT NULL,
    "id_material" INTEGER NOT NULL,
    "peso_kg" DECIMAL(10,2) NOT NULL,
    "preco_kg" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(12,2) DEFAULT (peso_kg * preco_kg),

    CONSTRAINT "itens_venda_pkey" PRIMARY KEY ("id_item_venda")
);

-- CreateTable
CREATE TABLE "ferro_velho"."logs" (
    "id_log" BIGSERIAL NOT NULL,
    "nivel" "ferro_velho"."NivelLog" NOT NULL,
    "mensagem" TEXT NOT NULL,
    "contexto" JSONB,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id_log")
);

-- CreateTable
CREATE TABLE "ferro_velho"."materiais" (
    "id_material" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "id_categoria" INTEGER,
    "unidade_medida" "ferro_velho"."UnidadeMedida" NOT NULL DEFAULT 'KG',
    "preco_compra_kg" DECIMAL(10,2) NOT NULL,
    "preco_venda_kg" DECIMAL(10,2) NOT NULL,
    "estoque_minimo_kg" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materiais_pkey" PRIMARY KEY ("id_material")
);

-- CreateTable
CREATE TABLE "ferro_velho"."movimentacoes_estoque" (
    "id_movimentacao" SERIAL NOT NULL,
    "id_material" INTEGER NOT NULL,
    "tipo" "ferro_velho"."TipoMovimentacao" NOT NULL,
    "quantidade_kg" DECIMAL(12,2) NOT NULL,
    "origem" "ferro_velho"."OrigemMovimentacao" NOT NULL,
    "id_referencia" INTEGER,
    "id_usuario" INTEGER,
    "data_movimentacao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" VARCHAR(255),

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id_movimentacao")
);

-- CreateTable
CREATE TABLE "ferro_velho"."perfis" (
    "id_perfil" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "descricao" VARCHAR(255),
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perfis_pkey" PRIMARY KEY ("id_perfil")
);

-- CreateTable
CREATE TABLE "ferro_velho"."usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "id_perfil" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "ferro_velho"."vendas" (
    "id_venda" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "data_venda" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "ferro_velho"."SituacaoOperacao" NOT NULL DEFAULT 'CONCLUIDA',
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendas_pkey" PRIMARY KEY ("id_venda")
);

-- CreateIndex
CREATE INDEX "idx_auditoria_tabela_reg" ON "ferro_velho"."auditoria"("tabela", "id_registro");

-- CreateIndex
CREATE INDEX "idx_auditoria_usuario_data" ON "ferro_velho"."auditoria"("id_usuario", "data_hora");

-- CreateIndex
CREATE INDEX "idx_auditoria_data" ON "ferro_velho"."auditoria"("data_hora");

-- CreateIndex
CREATE UNIQUE INDEX "uq_categorias_nome" ON "ferro_velho"."categorias"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "uq_clientes_documento" ON "ferro_velho"."clientes"("documento");

-- CreateIndex
CREATE INDEX "idx_clientes_nome_trgm" ON "ferro_velho"."clientes" USING GIN ("nome" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "idx_compras_data" ON "ferro_velho"."compras"("data_compra");

-- CreateIndex
CREATE INDEX "idx_compras_status_data" ON "ferro_velho"."compras"("status", "data_compra");

-- CreateIndex
CREATE INDEX "idx_compras_fornecedor" ON "ferro_velho"."compras"("id_fornecedor");

-- CreateIndex
CREATE INDEX "idx_compras_usuario" ON "ferro_velho"."compras"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "uq_estoque_material" ON "ferro_velho"."estoque"("id_material");

-- CreateIndex
CREATE UNIQUE INDEX "uq_fornecedores_documento" ON "ferro_velho"."fornecedores"("documento");

-- CreateIndex
CREATE INDEX "idx_fornecedores_nome_trgm" ON "ferro_velho"."fornecedores" USING GIN ("nome" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "idx_itens_compra_compra" ON "ferro_velho"."itens_compra"("id_compra");

-- CreateIndex
CREATE INDEX "idx_itens_compra_material" ON "ferro_velho"."itens_compra"("id_material");

-- CreateIndex
CREATE INDEX "idx_itens_venda_material" ON "ferro_velho"."itens_venda"("id_material");

-- CreateIndex
CREATE INDEX "idx_itens_venda_venda" ON "ferro_velho"."itens_venda"("id_venda");

-- CreateIndex
CREATE INDEX "idx_logs_nivel_data" ON "ferro_velho"."logs"("nivel", "criado_em");

-- CreateIndex
CREATE UNIQUE INDEX "uq_materiais_nome" ON "ferro_velho"."materiais"("nome");

-- CreateIndex
CREATE INDEX "idx_materiais_categoria" ON "ferro_velho"."materiais"("id_categoria");

-- CreateIndex
CREATE INDEX "idx_materiais_nome_trgm" ON "ferro_velho"."materiais" USING GIN ("nome" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "idx_mov_data" ON "ferro_velho"."movimentacoes_estoque"("data_movimentacao");

-- CreateIndex
CREATE INDEX "idx_mov_material" ON "ferro_velho"."movimentacoes_estoque"("id_material");

-- CreateIndex
CREATE INDEX "idx_mov_material_data" ON "ferro_velho"."movimentacoes_estoque"("id_material", "data_movimentacao");

-- CreateIndex
CREATE UNIQUE INDEX "uq_perfis_nome" ON "ferro_velho"."perfis"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "uq_usuarios_email" ON "ferro_velho"."usuarios"("email");

-- CreateIndex
CREATE INDEX "idx_usuarios_perfil" ON "ferro_velho"."usuarios"("id_perfil");

-- CreateIndex
CREATE INDEX "idx_vendas_cliente" ON "ferro_velho"."vendas"("id_cliente");

-- CreateIndex
CREATE INDEX "idx_vendas_data" ON "ferro_velho"."vendas"("data_venda");

-- CreateIndex
CREATE INDEX "idx_vendas_status_data" ON "ferro_velho"."vendas"("status", "data_venda");

-- CreateIndex
CREATE INDEX "idx_vendas_usuario" ON "ferro_velho"."vendas"("id_usuario");

-- AddForeignKey
ALTER TABLE "ferro_velho"."auditoria" ADD CONSTRAINT "fk_auditoria_usuario" FOREIGN KEY ("id_usuario") REFERENCES "ferro_velho"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferro_velho"."compras" ADD CONSTRAINT "fk_compras_fornecedor" FOREIGN KEY ("id_fornecedor") REFERENCES "ferro_velho"."fornecedores"("id_fornecedor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferro_velho"."compras" ADD CONSTRAINT "fk_compras_usuario" FOREIGN KEY ("id_usuario") REFERENCES "ferro_velho"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferro_velho"."estoque" ADD CONSTRAINT "fk_estoque_material" FOREIGN KEY ("id_material") REFERENCES "ferro_velho"."materiais"("id_material") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferro_velho"."itens_compra" ADD CONSTRAINT "fk_itens_compra_compra" FOREIGN KEY ("id_compra") REFERENCES "ferro_velho"."compras"("id_compra") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferro_velho"."itens_compra" ADD CONSTRAINT "fk_itens_compra_material" FOREIGN KEY ("id_material") REFERENCES "ferro_velho"."materiais"("id_material") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferro_velho"."itens_venda" ADD CONSTRAINT "fk_itens_venda_material" FOREIGN KEY ("id_material") REFERENCES "ferro_velho"."materiais"("id_material") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferro_velho"."itens_venda" ADD CONSTRAINT "fk_itens_venda_venda" FOREIGN KEY ("id_venda") REFERENCES "ferro_velho"."vendas"("id_venda") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferro_velho"."materiais" ADD CONSTRAINT "fk_materiais_categoria" FOREIGN KEY ("id_categoria") REFERENCES "ferro_velho"."categorias"("id_categoria") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferro_velho"."movimentacoes_estoque" ADD CONSTRAINT "fk_mov_material" FOREIGN KEY ("id_material") REFERENCES "ferro_velho"."materiais"("id_material") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferro_velho"."movimentacoes_estoque" ADD CONSTRAINT "fk_mov_usuario" FOREIGN KEY ("id_usuario") REFERENCES "ferro_velho"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferro_velho"."usuarios" ADD CONSTRAINT "fk_usuarios_perfil" FOREIGN KEY ("id_perfil") REFERENCES "ferro_velho"."perfis"("id_perfil") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferro_velho"."vendas" ADD CONSTRAINT "fk_vendas_cliente" FOREIGN KEY ("id_cliente") REFERENCES "ferro_velho"."clientes"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferro_velho"."vendas" ADD CONSTRAINT "fk_vendas_usuario" FOREIGN KEY ("id_usuario") REFERENCES "ferro_velho"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ferro_velho"."materiais"
  ADD CONSTRAINT "ck_materiais_preco_compra" CHECK ("preco_compra_kg" >= 0),
  ADD CONSTRAINT "ck_materiais_preco_venda" CHECK ("preco_venda_kg" >= 0),
  ADD CONSTRAINT "ck_materiais_estoque_minimo" CHECK ("estoque_minimo_kg" >= 0);

ALTER TABLE "ferro_velho"."estoque"
  ADD CONSTRAINT "ck_estoque_quantidade" CHECK ("quantidade_kg" >= 0);

ALTER TABLE "ferro_velho"."itens_compra"
  ADD CONSTRAINT "ck_itens_compra_peso" CHECK ("peso_kg" > 0),
  ADD CONSTRAINT "ck_itens_compra_preco" CHECK ("preco_kg" >= 0);

ALTER TABLE "ferro_velho"."itens_venda"
  ADD CONSTRAINT "ck_itens_venda_peso" CHECK ("peso_kg" > 0),
  ADD CONSTRAINT "ck_itens_venda_preco" CHECK ("preco_kg" >= 0);

ALTER TABLE "ferro_velho"."compras"
  ADD CONSTRAINT "ck_compras_valor_total" CHECK ("valor_total" >= 0);

ALTER TABLE "ferro_velho"."vendas"
  ADD CONSTRAINT "ck_vendas_valor_total" CHECK ("valor_total" >= 0);

