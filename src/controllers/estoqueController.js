const pool = require("../database/db");

async function listarEstoque(req, res) {
  const result = await pool.query(`
    SELECT 
      m.id_material,
      m.nome,
      COALESCE(e.quantidade_kg, 0)::float8 AS quantidade_kg,
      m.preco_base::float8 AS preco_base
    FROM material m
    LEFT JOIN estoque e ON m.id_material = e.id_material
    WHERE m.ativo = TRUE
    ORDER BY m.nome ASC
  `);

  res.json(result.rows);
}

module.exports = { listarEstoque };
