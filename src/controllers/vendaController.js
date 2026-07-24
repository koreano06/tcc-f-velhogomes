const pool = require("../database/db");

async function listarVendas(req, res) {
  const result = await pool.query(`
    SELECT
      v.id_venda,
      v.data,
      v.valor_total,
      m.nome AS nome_material,
      iv.peso,
      iv.preco_kg
    FROM venda v
    LEFT JOIN item_venda iv ON iv.id_venda = v.id_venda
    LEFT JOIN material m ON m.id_material = iv.id_material
    ORDER BY v.data DESC
  `);

  res.json(result.rows);
}

module.exports = { listarVendas };
