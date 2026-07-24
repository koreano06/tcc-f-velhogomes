const pool = require("../database/db");

async function totalVendidoPorCliente(req, res) {
  const result = await pool.query(`
    SELECT
      c.nome AS cliente,
      COUNT(v.id_venda) AS total_vendas,
      SUM(v.valor_total) AS total_gasto
    FROM cliente c
    JOIN venda v ON v.id_cliente = c.id_cliente
    GROUP BY c.nome
    ORDER BY total_gasto DESC
  `);

  res.json(result.rows);
}

module.exports = { totalVendidoPorCliente };
