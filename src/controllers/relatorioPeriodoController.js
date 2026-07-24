const pool = require("../database/db");

async function totalVendidoPorPeriodo(req, res) {
  const { dataInicio, dataFim } = req.query;

  if (!dataInicio || !dataFim) {
    return res.status(400).json({ error: "Informe dataInicio e dataFim." });
  }

  const result = await pool.query(
    `
    SELECT
      v."data"::date AS data_venda,
      SUM(iv.subtotal) AS total_vendido
    FROM venda v
    JOIN item_venda iv ON iv.id_venda = v.id_venda
    WHERE v."data" BETWEEN $1 AND $2
    GROUP BY v."data"::date
    ORDER BY data_venda
    `,
    [dataInicio, dataFim]
  );

  res.json(result.rows);
}

module.exports = { totalVendidoPorPeriodo };
