-- ============================================================================
-- 02_INDICES.sql — Índices de performance
-- (chaves primárias e UNIQUE já geram índice automaticamente)
-- ============================================================================
SET search_path TO ferro_velho, public;

-- Buscas e joins frequentes por FK
CREATE INDEX idx_usuarios_perfil          ON usuarios (id_perfil);
CREATE INDEX idx_materiais_categoria      ON materiais (id_categoria);
CREATE INDEX idx_compras_fornecedor       ON compras (id_fornecedor);
CREATE INDEX idx_compras_usuario          ON compras (id_usuario);
CREATE INDEX idx_itens_compra_compra      ON itens_compra (id_compra);
CREATE INDEX idx_itens_compra_material    ON itens_compra (id_material);
CREATE INDEX idx_vendas_cliente           ON vendas (id_cliente);
CREATE INDEX idx_vendas_usuario           ON vendas (id_usuario);
CREATE INDEX idx_itens_venda_venda        ON itens_venda (id_venda);
CREATE INDEX idx_itens_venda_material     ON itens_venda (id_material);
CREATE INDEX idx_mov_material             ON movimentacoes_estoque (id_material);
CREATE INDEX idx_mov_data                 ON movimentacoes_estoque (data_movimentacao);
CREATE INDEX idx_auditoria_tabela_reg     ON auditoria (tabela, id_registro);
CREATE INDEX idx_logs_nivel_data          ON logs (nivel, criado_em);

-- Relatórios por período (datas de venda/compra)
CREATE INDEX idx_vendas_data              ON vendas (data_venda);
CREATE INDEX idx_compras_data             ON compras (data_compra);

-- Busca textual (nome de clientes, fornecedores, materiais) usando pg_trgm
CREATE INDEX idx_clientes_nome_trgm       ON clientes USING gin (nome gin_trgm_ops);
CREATE INDEX idx_fornecedores_nome_trgm   ON fornecedores USING gin (nome gin_trgm_ops);
CREATE INDEX idx_materiais_nome_trgm      ON materiais USING gin (nome gin_trgm_ops);

-- Índices parciais para registros ativos (consultas mais comuns do dia a dia)
CREATE INDEX idx_materiais_ativos   ON materiais (id_material) WHERE ativo = TRUE;
CREATE INDEX idx_clientes_ativos    ON clientes (id_cliente)   WHERE ativo = TRUE;
CREATE INDEX idx_fornecedores_ativos ON fornecedores (id_fornecedor) WHERE ativo = TRUE;
