const pool = require('../database/db');

// GET /api/materiais
async function listarMateriais(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        m.id,
        m.nome,
        m.preco_compra_kg,
        m.preco_venda_kg,
        m.estoque_minimo_kg,
        COALESCE(e.quantidade_kg, 0) AS quantidade_kg
      FROM material m
      LEFT JOIN estoque e ON e.id_material = m.id
      ORDER BY m.nome
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('listarMateriais:', err.message);
    res.status(500).json({ error: 'Erro ao buscar materiais.' });
  }
}

// POST /api/materiais
async function criarMaterial(req, res) {
  const { nome, preco_compra_kg, preco_venda_kg, estoque_minimo_kg } = req.body;

  if (!nome || preco_compra_kg == null || preco_venda_kg == null) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, preco_compra_kg, preco_venda_kg.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO material (nome, preco_compra_kg, preco_venda_kg, estoque_minimo_kg)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [nome.trim(), preco_compra_kg, preco_venda_kg, estoque_minimo_kg ?? 0]
    );

    await pool.query(
      `INSERT INTO estoque (id_material, quantidade_kg)
       VALUES ($1, 0) ON CONFLICT (id_material) DO NOTHING`,
      [result.rows[0].id]
    );

    await pool.query(
      `INSERT INTO auditoria (acao, descricao) VALUES ($1, $2)`,
      ['Material cadastrado', `${nome.trim()} adicionado ao sistema.`]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('criarMaterial:', err.message);
    res.status(500).json({ error: 'Erro ao criar material.' });
  }
}

// PUT /api/materiais/:id
async function atualizarMaterial(req, res) {
  const { id } = req.params;
  const { nome, preco_compra_kg, preco_venda_kg, estoque_minimo_kg } = req.body;

  try {
    const result = await pool.query(
      `UPDATE material
       SET
         nome              = COALESCE($1, nome),
         preco_compra_kg   = COALESCE($2, preco_compra_kg),
         preco_venda_kg    = COALESCE($3, preco_venda_kg),
         estoque_minimo_kg = COALESCE($4, estoque_minimo_kg)
       WHERE id = $5
       RETURNING *`,
      [nome ?? null, preco_compra_kg ?? null, preco_venda_kg ?? null, estoque_minimo_kg ?? null, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Material não encontrado.' });

    await pool.query(
      `INSERT INTO auditoria (acao, descricao) VALUES ($1, $2)`,
      ['Material atualizado', `Material ID ${id} atualizado.`]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('atualizarMaterial:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar material.' });
  }
}

// DELETE /api/materiais/:id
async function deletarMaterial(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM material WHERE id = $1 RETURNING nome', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Material não encontrado.' });

    await pool.query(
      `INSERT INTO auditoria (acao, descricao) VALUES ($1, $2)`,
      ['Material removido', `${result.rows[0].nome} removido do sistema.`]
    );

    res.status(204).send();
  } catch (err) {
    console.error('deletarMaterial:', err.message);
    res.status(500).json({ error: 'Erro ao deletar material.' });
  }
}

module.exports = { listarMateriais, criarMaterial, atualizarMaterial, deletarMaterial };
