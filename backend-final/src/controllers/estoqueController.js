const pool = require('../database/db');

// GET /api/estoque
async function getEstoque(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        m.id              AS id_material,
        m.nome,
        COALESCE(e.quantidade_kg, 0) AS quantidade_kg,
        m.preco_compra_kg,
        m.preco_venda_kg,
        m.estoque_minimo_kg
      FROM material m
      LEFT JOIN estoque e ON e.id_material = m.id
      ORDER BY m.nome
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('getEstoque:', err.message);
    res.status(500).json({ error: 'Erro ao buscar estoque.' });
  }
}

module.exports = { getEstoque };
