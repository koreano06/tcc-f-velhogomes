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

  const vendas = await prisma.vendas.findMany({
    where: { data_venda: { gte: period.start, lte: period.end } },
    orderBy: { data_venda: "asc" },
  });

  const grouped = new Map();
  for (const venda of vendas) {
    const data = venda.data_venda.toISOString().slice(0, 10);
    grouped.set(data, toNumber(grouped.get(data)) + toNumber(venda.valor_total));
  }

  res.json(Array.from(grouped.entries()).map(([data_venda, total_vendido]) => ({ data_venda, total_vendido })));
}

async function lucroPorMaterial(req, res) {
  const period = parsePeriod(req, res);
  if (!period) return;

  const materiais = await prisma.materiais.findMany({
    where: { ativo: true },
    include: {
      itens_compra: { where: { compras: { data_compra: { gte: period.start, lte: period.end } } } },
      itens_venda: { where: { vendas: { data_venda: { gte: period.start, lte: period.end } } } },
    },
    orderBy: { nome: "asc" },
  });

  const rows = materiais
    .map((material) => {
      const totalCompras = material.itens_compra.reduce((sum, item) => sum + toNumber(item.subtotal), 0);
      const totalVendas = material.itens_venda.reduce((sum, item) => sum + toNumber(item.subtotal), 0);
      return { nome: material.nome, lucro_total: totalVendas - totalCompras };
    })
    .filter((item) => item.lucro_total !== 0)
    .sort((a, b) => b.lucro_total - a.lucro_total);

  res.json(rows);
}

async function totalVendidoPorMaterial(req, res) {
  const materiais = await prisma.materiais.findMany({
    where: { ativo: true },
    include: { itens_venda: true },
    orderBy: { nome: "asc" },
  });

  res.json(
    materiais.map((material) => ({
      nome: material.nome,
      total_peso: material.itens_venda.reduce((sum, item) => sum + toNumber(item.peso_kg), 0),
      total_valor: material.itens_venda.reduce((sum, item) => sum + toNumber(item.subtotal), 0),
    }))
  );
}

module.exports = { financeiroPorPeriodo, lucroPorMaterial, totalVendidoPorMaterial };
