<<<<<<< HEAD
const prisma = require("../lib/prisma");
const { toNumber } = require("../lib/number");

function parsePeriod(req, res) {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    res.status(400).json({ error: "Informe startDate e endDate." });
    return null;
  }

  return {
    start: new Date(`${startDate}T00:00:00`),
    end: new Date(`${endDate}T23:59:59`),
  };
}

async function financeiroPorPeriodo(req, res) {
  const period = parsePeriod(req, res);
  if (!period) return;

  const vendas = await prisma.sale.findMany({
    where: { createdAt: { gte: period.start, lte: period.end } },
    orderBy: { createdAt: "asc" },
  });

  const grouped = new Map();
  for (const venda of vendas) {
    const data = venda.createdAt.toISOString().slice(0, 10);
    grouped.set(data, toNumber(grouped.get(data)) + toNumber(venda.total));
  }

  res.json(
    Array.from(grouped.entries()).map(([data_venda, total_vendido]) => ({
      data_venda,
      total_vendido,
    }))
  );
}

async function lucroPorMaterial(req, res) {
  const period = parsePeriod(req, res);
  if (!period) return;

  const materiais = await prisma.material.findMany({
    where: { active: true },
    include: {
      purchases: { where: { createdAt: { gte: period.start, lte: period.end } } },
      sales: { where: { createdAt: { gte: period.start, lte: period.end } } },
    },
    orderBy: { nome: "asc" },
  });

  const rows = materiais
    .map((material) => {
      const totalCompras = material.purchases.reduce((sum, compra) => sum + toNumber(compra.total), 0);
      const totalVendas = material.sales.reduce((sum, venda) => sum + toNumber(venda.total), 0);

      return {
        nome: material.nome,
        lucro_total: totalVendas - totalCompras,
      };
    })
    .filter((item) => item.lucro_total !== 0)
    .sort((a, b) => b.lucro_total - a.lucro_total);

  res.json(rows);
}

async function totalVendidoPorMaterial(req, res) {
  const materiais = await prisma.material.findMany({
    where: { active: true },
    include: { sales: true },
    orderBy: { nome: "asc" },
  });

  res.json(
    materiais.map((material) => ({
      nome: material.nome,
      total_peso: material.sales.reduce((sum, venda) => sum + toNumber(venda.weightKg), 0),
      total_valor: material.sales.reduce((sum, venda) => sum + toNumber(venda.total), 0),
    }))
  );
}

module.exports = { financeiroPorPeriodo, lucroPorMaterial, totalVendidoPorMaterial };

=======
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
>>>>>>> 9bd93b89a5a1c31e2b7bfb0c84358369ca6f1f7d
