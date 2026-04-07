const pool = require('../database/db');

// GET /api/reports/financial?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
async function getFinancialReport(req, res) {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Parâmetros obrigatórios: startDate e endDate (YYYY-MM-DD).' });
  }

  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(criado_em, 'YYYY-MM-DD') AS data_venda,
        SUM(total) AS total_vendido
      FROM vendas
      WHERE criado_em::date BETWEEN $1 AND $2
      GROUP BY TO_CHAR(criado_em, 'YYYY-MM-DD')
      ORDER BY data_venda
    `, [startDate, endDate]);

    res.json(result.rows);
  } catch (err) {
    console.error('getFinancialReport:', err.message);
    res.status(500).json({ error: 'Erro ao gerar relatório financeiro.' });
  }
}

// GET /api/reports/profit-by-material?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
async function getProfitByMaterial(req, res) {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Parâmetros obrigatórios: startDate e endDate (YYYY-MM-DD).' });
  }

  try {
    const result = await pool.query(`
      SELECT
        m.nome,
        COALESCE(SUM(v.total), 0) - COALESCE(SUM(c.total), 0) AS lucro_total
      FROM material m
      LEFT JOIN vendas v   ON v.id_material = m.id
                          AND v.criado_em::date BETWEEN $1 AND $2
      LEFT JOIN compras c  ON c.id_material = m.id
                          AND c.criado_em::date BETWEEN $1 AND $2
      GROUP BY m.id, m.nome
      HAVING COALESCE(SUM(v.total), 0) > 0 OR COALESCE(SUM(c.total), 0) > 0
      ORDER BY lucro_total DESC
    `, [startDate, endDate]);

    res.json(result.rows);
  } catch (err) {
    console.error('getProfitByMaterial:', err.message);
    res.status(500).json({ error: 'Erro ao gerar relatório de lucro.' });
  }
}

module.exports = { getFinancialReport, getProfitByMaterial };
