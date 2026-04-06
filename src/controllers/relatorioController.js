const pool = require("../database/db");

async function totalVendidoPorMaterial(req, res) {
  const result = await pool.query(`
    SELECT
      m.nome,
      SUM(iv.peso) AS total_peso,
      SUM(iv.subtotal) AS total_valor
    FROM item_venda iv
    JOIN material m ON m.id_material = iv.id_material
    GROUP BY m.nome
    ORDER BY m.nome
  `);

  res.json(result.rows);
}

async function financeiroPorPeriodo(req, res) {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Informe startDate e endDate." });
  }

  const result = await pool.query(
    `
    SELECT
      TO_CHAR(data, 'DD/MM/YYYY') AS data_venda,
      SUM(valor_total) AS total_vendido
    FROM venda
    WHERE data::date BETWEEN $1 AND $2
    GROUP BY data::date, TO_CHAR(data, 'DD/MM/YYYY')
    ORDER BY data::date DESC
    `,
    [startDate, endDate]
  );

  res.json(result.rows);
}

module.exports = { totalVendidoPorMaterial, financeiroPorPeriodo };
