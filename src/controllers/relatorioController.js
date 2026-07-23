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

