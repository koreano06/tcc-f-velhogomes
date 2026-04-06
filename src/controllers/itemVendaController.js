const pool = require('../database/db');

// Criar item da venda (COM O PESO CORRIGIDO)
async function criarItemVenda(req, res) {
  // Recebe o peso junto com os outros dados
  const { id_venda, id_material, valor_unitario, peso } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO item_venda 
       (id_venda, id_material, valor_unitario, peso)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id_venda, id_material, valor_unitario, peso] // 4 variáveis para 4 placeholders ($)
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Listar itens da venda
async function listarItensVenda(req, res) {
  try {
    const result = await pool.query(
      `SELECT iv.id_item_venda, m.nome, iv.valor_unitario, iv.peso
       FROM item_venda iv
       JOIN material m ON m.id_material = iv.id_material`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  criarItemVenda,
  listarItensVenda
};