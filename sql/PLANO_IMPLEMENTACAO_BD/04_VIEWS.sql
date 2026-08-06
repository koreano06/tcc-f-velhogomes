-- ============================================================================
-- 04_VIEWS.sql — Views para relatórios e consultas gerenciais
-- ============================================================================
SET search_path TO ferro_velho, public;

-- 1. Estoque atual por material
CREATE OR REPLACE VIEW vw_estoque_atual AS
SELECT
    m.id_material,
    m.nome              AS material,
    c.nome              AS categoria,
    e.quantidade_kg,
    m.preco_venda_kg,
    (e.quantidade_kg * m.preco_venda_kg) AS valor_estoque_estimado,
    e.atualizado_em
FROM estoque e
JOIN materiais m  ON m.id_material = e.id_material
LEFT JOIN categorias c ON c.id_categoria = m.id_categoria
ORDER BY m.nome;

-- 2. Total comprado por fornecedor
CREATE OR REPLACE VIEW vw_compras_por_fornecedor AS
SELECT
    f.id_fornecedor,
    f.nome              AS fornecedor,
    COUNT(c.id_compra)  AS total_compras,
    COALESCE(SUM(c.valor_total), 0) AS valor_total_comprado
FROM fornecedores f
LEFT JOIN compras c ON c.id_fornecedor = f.id_fornecedor AND c.status = 'CONCLUIDA'
GROUP BY f.id_fornecedor, f.nome
ORDER BY valor_total_comprado DESC;

-- 3. Total vendido por cliente
CREATE OR REPLACE VIEW vw_vendas_por_cliente AS
SELECT
    cl.id_cliente,
    cl.nome             AS cliente,
    COUNT(v.id_venda)   AS total_vendas,
    COALESCE(SUM(v.valor_total), 0) AS valor_total_gasto
FROM clientes cl
LEFT JOIN vendas v ON v.id_cliente = cl.id_cliente AND v.status = 'CONCLUIDA'
GROUP BY cl.id_cliente, cl.nome
ORDER BY valor_total_gasto DESC;

-- 4. Materiais mais vendidos (por peso e por valor)
CREATE OR REPLACE VIEW vw_materiais_mais_vendidos AS
SELECT
    m.id_material,
    m.nome              AS material,
    SUM(iv.peso_kg)     AS total_kg_vendido,
    SUM(iv.subtotal)    AS total_valor_vendido
FROM itens_venda iv
JOIN vendas v      ON v.id_venda = iv.id_venda AND v.status = 'CONCLUIDA'
JOIN materiais m   ON m.id_material = iv.id_material
GROUP BY m.id_material, m.nome
ORDER BY total_valor_vendido DESC;

-- 5. Movimentações recentes de estoque (últimas 200)
CREATE OR REPLACE VIEW vw_movimentacoes_recentes AS
SELECT
    me.id_movimentacao,
    m.nome              AS material,
    me.tipo,
    me.quantidade_kg,
    me.origem,
    me.id_referencia,
    u.nome              AS usuario,
    me.data_movimentacao,
    me.observacao
FROM movimentacoes_estoque me
JOIN materiais m ON m.id_material = me.id_material
LEFT JOIN usuarios u ON u.id_usuario = me.id_usuario
ORDER BY me.data_movimentacao DESC
LIMIT 200;

-- 6. Vendas com valor diário consolidado (curva de faturamento)
CREATE OR REPLACE VIEW vw_faturamento_diario AS
SELECT
    v.data_venda::date  AS dia,
    COUNT(v.id_venda)   AS qtd_vendas,
    SUM(v.valor_total)  AS total_faturado
FROM vendas v
WHERE v.status = 'CONCLUIDA'
GROUP BY v.data_venda::date
ORDER BY dia DESC;

-- 7. Usuários e seus perfis (sem expor senha)
CREATE OR REPLACE VIEW vw_usuarios_perfis AS
SELECT
    u.id_usuario,
    u.nome,
    u.email,
    p.nome AS perfil,
    u.ativo,
    u.criado_em
FROM usuarios u
JOIN perfis p ON p.id_perfil = u.id_perfil;

-- 8. Margem estimada por material (venda - compra)
CREATE OR REPLACE VIEW vw_margem_materiais AS
SELECT
    m.id_material,
    m.nome AS material,
    m.preco_compra_kg,
    m.preco_venda_kg,
    (m.preco_venda_kg - m.preco_compra_kg) AS margem_kg,
    CASE WHEN m.preco_compra_kg > 0
         THEN ROUND(((m.preco_venda_kg - m.preco_compra_kg) / m.preco_compra_kg) * 100, 2)
         ELSE NULL
    END AS margem_percentual
FROM materiais m
WHERE m.ativo = TRUE
ORDER BY margem_percentual DESC NULLS LAST;
