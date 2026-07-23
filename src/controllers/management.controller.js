const prisma = require("../lib/prisma");
const { toNumber } = require("../lib/number");

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

async function getOverview(req, res) {
  const inicioMes = startOfCurrentMonth();

  const [comprasMes, vendasMes, materiais, parados] = await Promise.all([
    prisma.purchase.aggregate({
      where: { createdAt: { gte: inicioMes } },
      _sum: { total: true },
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: inicioMes } },
      _sum: { total: true },
    }),
    prisma.material.findMany({
      where: { active: true },
      include: { stock: true },
      orderBy: { nome: "asc" },
    }),
    prisma.material.count({
      where: {
        active: true,
        purchases: { none: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        sales: { none: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      },
    }),
  ]);

  const compras = toNumber(comprasMes._sum.total);
  const vendas = toNumber(vendasMes._sum.total);
  const alertas = materiais
    .filter((material) => toNumber(material.estoqueMinimoKg) > 0 && toNumber(material.stock?.quantityKg) <= toNumber(material.estoqueMinimoKg))
    .map((material) => `${material.nome}: ${toNumber(material.stock?.quantityKg).toFixed(2)} kg em estoque.`);

  res.json({
    compras_mes: compras,
    vendas_mes: vendas,
    lucro_mes: vendas - compras,
    giro_estoque_dias: 0,
    materiais_parados: parados,
    alertas,
  });
}

async function getFinance(req, res) {
  const [vendasTotal, comprasTotal, ultimasCompras] = await Promise.all([
    prisma.sale.aggregate({ _sum: { total: true } }),
    prisma.purchase.aggregate({ _sum: { total: true } }),
    prisma.purchase.findMany({
      include: { material: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const totalVendas = toNumber(vendasTotal._sum.total);
  const totalCompras = toNumber(comprasTotal._sum.total);

  res.json({
    cards: {
      contas_pagar: totalCompras,
      contas_receber: totalVendas,
      caixa_disponivel: totalVendas - totalCompras,
      inadimplencia: 0,
    },
    vencimentos: ultimasCompras.map((compra) => ({
      descricao: compra.material.nome,
      vencimento: new Date(compra.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      valor: toNumber(compra.total),
    })),
  });
}

async function getPartners(req, res) {
  const [compras, vendas] = await Promise.all([
    prisma.purchase.groupBy({
      by: ["materialId"],
      _sum: { weightKg: true, total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 10,
    }),
    prisma.sale.groupBy({
      by: ["materialId"],
      _sum: { weightKg: true, total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 10,
    }),
  ]);

  const materialIds = [...new Set([...compras, ...vendas].map((item) => item.materialId))];
  const materiais = await prisma.material.findMany({ where: { id: { in: materialIds } } });
  const names = new Map(materiais.map((material) => [material.id, material.nome]));

  const mapGroup = (item) => ({
    nome: names.get(item.materialId) || "Material removido",
    peso_total_kg: toNumber(item._sum.weightKg),
    valor_total: toNumber(item._sum.total),
  });

  res.json({
    fornecedores: compras.map(mapGroup),
    clientes: vendas.map(mapGroup),
  });
}

async function getAudit(req, res) {
  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  res.json(
    logs.map((log) => ({
      acao: log.action,
      descricao: log.description,
      usuario: log.user?.name || "sistema",
      data_hora: log.createdAt.toISOString(),
    }))
  );
}

module.exports = { getOverview, getFinance, getPartners, getAudit };

