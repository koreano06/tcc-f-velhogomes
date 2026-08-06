-- ============================================================================
-- 06_DML.sql — Data Manipulation Language (carga inicial / seed)
-- ============================================================================
SET search_path TO ferro_velho, public;

-- 1. Perfis
INSERT INTO perfis (nome, descricao) VALUES
    ('ADMIN',    'Acesso total ao sistema'),
    ('OPERADOR', 'Registra compras, vendas e consulta estoque'),
    ('LEITURA',  'Apenas consulta relatórios e dados');

-- 2. Usuários (senha de exemplo com hash bcrypt via pgcrypto)
INSERT INTO usuarios (nome, email, senha_hash, id_perfil) VALUES
    ('Administrador', 'admin@ferrovelho.com',    fn_hash_senha('Admin@123'),    (SELECT id_perfil FROM perfis WHERE nome = 'ADMIN')),
    ('Operador Caixa', 'operador@ferrovelho.com', fn_hash_senha('Operador@123'), (SELECT id_perfil FROM perfis WHERE nome = 'OPERADOR'));

-- 3. Categorias
INSERT INTO categorias (nome, descricao) VALUES
    ('Ferrosos',      'Materiais à base de ferro e aço'),
    ('Não Ferrosos',  'Alumínio, cobre, bronze, etc.'),
    ('Eletrônicos',   'Sucata eletrônica e placas'),
    ('Baterias',      'Baterias automotivas e industriais');

-- 4. Fornecedores
INSERT INTO fornecedores (nome, documento, telefone, email, endereco) VALUES
    ('Fornecedor A Sucatas Ltda', '12.345.678/0001-90', '(11) 99999-9999', 'contato@fornecedora.com', 'Rua das Sucatas, 100'),
    ('Fornecedor B Reciclagem',   '98.765.432/0001-10', '(11) 98888-8888', 'contato@fornecedorb.com', 'Av. dos Metais, 200');

-- 5. Clientes
INSERT INTO clientes (nome, documento, telefone, email, endereco) VALUES
    ('João Silva',   '123.456.789-00', '(11) 97777-7777', 'joao@email.com',  'Rua A, 10'),
    ('Maria Souza',  '987.654.321-00', '(11) 96666-6666', 'maria@email.com', 'Rua B, 20'),
    ('Consumidor Final', NULL, NULL, NULL, NULL);

-- 6. Materiais
INSERT INTO materiais (nome, id_categoria, preco_compra_kg, preco_venda_kg) VALUES
    ('Ferro',            (SELECT id_categoria FROM categorias WHERE nome = 'Ferrosos'),     0.90, 1.20),
    ('Ferro Pesado',      (SELECT id_categoria FROM categorias WHERE nome = 'Ferrosos'),     1.00, 1.35),
    ('Alumínio',          (SELECT id_categoria FROM categorias WHERE nome = 'Não Ferrosos'), 5.50, 7.20),
    ('Alumínio Latinha',  (SELECT id_categoria FROM categorias WHERE nome = 'Não Ferrosos'), 5.80, 7.50),
    ('Cobre',             (SELECT id_categoria FROM categorias WHERE nome = 'Não Ferrosos'), 30.00, 38.50),
    ('Cobre Mel',         (SELECT id_categoria FROM categorias WHERE nome = 'Não Ferrosos'), 32.00, 40.00),
    ('Bateria Automotiva',(SELECT id_categoria FROM categorias WHERE nome = 'Baterias'),     3.00, 4.20),
    ('Placa Eletrônica',  (SELECT id_categoria FROM categorias WHERE nome = 'Eletrônicos'),  8.00, 12.00);

-- 7. Estoque inicial zerado para todos os materiais cadastrados
INSERT INTO estoque (id_material, quantidade_kg)
SELECT id_material, 0 FROM materiais
ON CONFLICT (id_material) DO NOTHING;

-- ------------------------------------------------------------------
-- 8. Transações de exemplo (usam as procedures — populam estoque,
--    movimentações e totais automaticamente via triggers)
-- ------------------------------------------------------------------
DO $$
DECLARE
    v_id_fornecedor INT := (SELECT id_fornecedor FROM fornecedores WHERE nome = 'Fornecedor A Sucatas Ltda');
    v_id_admin      INT := (SELECT id_usuario FROM usuarios WHERE email = 'admin@ferrovelho.com');
    v_id_cliente    INT := (SELECT id_cliente FROM clientes WHERE nome = 'João Silva');
    v_id_operador   INT := (SELECT id_usuario FROM usuarios WHERE email = 'operador@ferrovelho.com');
BEGIN
    CALL sp_registrar_compra(
        v_id_fornecedor,
        v_id_admin,
        '[
            {"id_material": 1, "peso_kg": 500, "preco_kg": 0.90},
            {"id_material": 3, "peso_kg": 100, "preco_kg": 5.50}
         ]'::jsonb
    );

    CALL sp_registrar_venda(
        v_id_cliente,
        v_id_operador,
        '[
            {"id_material": 1, "peso_kg": 50, "preco_kg": 1.20},
            {"id_material": 3, "peso_kg": 10, "preco_kg": 7.20}
         ]'::jsonb
    );
END $$;
