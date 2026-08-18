const prisma = require("../lib/prisma");
const { toNumber } = require("../lib/number");

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function thirtyDaysAgo() {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
}

async function getOverview(req, res) {
  const inicioMes = startOfCurrentMonth();
  const dataLimite = thirtyDaysAgo();

  const [comprasMes, vendasMes, materiais, parados] = await Promise.all([
    prisma.compras.aggregate({ where: { data_compra: { gte: inicioMes } }, _sum: { valor_total: true } }),
    prisma.vendas.aggregate({ where: { data_venda: { gte: inicioMes } }, _sum: { valor_total: true } }),
    prisma.materiais.findMany({ where: { ativo: true }, include: { estoque: true }, orderBy: { nome: "asc" } }),
    prisma.materiais.count({
      where: {
        ativo: true,
        itens_compra: { none: { compras: { data_compra: { gte: dataLimite } } } },
        itens_venda: { none: { vendas: { data_venda: { gte: dataLimite } } } },
      },
    }),
  ]);

  const compras = toNumber(comprasMes._sum.valor_total);
  const vendas = toNumber(vendasMes._sum.valor_total);
  const alertas = materiais
    .filter((material) => {
      const quantidade = toNumber(material.estoque?.quantidade_kg);
      const minimo = toNumber(material.estoque_minimo_kg);
      return quantidade <= 0 || (minimo > 0 && quantidade <= minimo);
    })
    .map((material) => `${material.nome}: ${toNumber(material.estoque?.quantidade_kg).toFixed(2)} kg em estoque.`);

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
    prisma.vendas.aggregate({ _sum: { valor_total: true } }),
    prisma.compras.aggregate({ _sum: { valor_total: true } }),
    prisma.compras.findMany({
      include: { fornecedores: true },
      orderBy: { data_compra: "desc" },
      take: 6,
    }),
  ]);

  const totalVendas = toNumber(vendasTotal._sum.valor_total);
  const totalCompras = toNumber(comprasTotal._sum.valor_total);

  res.json({
    cards: {
      contas_pagar: totalCompras,
      contas_receber: totalVendas,
      caixa_disponivel: totalVendas - totalCompras,
      inadimplencia: 0,
    },
    vencimentos: ultimasCompras.map((compra) => ({
      descricao: compra.fornecedores.nome,
      vencimento: new Date(compra.data_compra.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      valor: toNumber(compra.valor_total),
    })),
  });
}

async function getPartners(req, res) {
  const [fornecedores, clientes] = await Promise.all([
    prisma.compras.groupBy({
      by: ["id_fornecedor"],
      _sum: { valor_total: true },
      orderBy: { _sum: { valor_total: "desc" } },
      take: 10,
    }),
    prisma.vendas.groupBy({
      by: ["id_cliente"],
      _sum: { valor_total: true },
      orderBy: { _sum: { valor_total: "desc" } },
      take: 10,
    }),
  ]);

  const fornecedorIds = fornecedores.map((item) => item.id_fornecedor);
  const clienteIds = clientes.map((item) => item.id_cliente);
  const [fornecedorRows, clienteRows] = await Promise.all([
    prisma.fornecedores.findMany({ where: { id_fornecedor: { in: fornecedorIds } } }),
    prisma.clientes.findMany({ where: { id_cliente: { in: clienteIds } } }),
  ]);

  const fornecedorNames = new Map(fornecedorRows.map((item) => [item.id_fornecedor, item.nome]));
  const clienteNames = new Map(clienteRows.map((item) => [item.id_cliente, item.nome]));

  res.json({
    fornecedores: fornecedores.map((item) => ({
      nome: fornecedorNames.get(item.id_fornecedor) || "Fornecedor removido",
      peso_total_kg: 0,
      valor_total: toNumber(item._sum.valor_total),
    })),
    clientes: clientes.map((item) => ({
      nome: clienteNames.get(item.id_cliente) || "Cliente removido",
      peso_total_kg: 0,
      valor_total: toNumber(item._sum.valor_total),
    })),
  });
}

async function getAudit(req, res) {
  const logs = await prisma.auditoria.findMany({ orderBy: { data_hora: "desc" }, take: 50 });

  res.json(
    logs.map((log) => ({
      acao: `${log.operacao} em ${log.tabela}`,
      descricao: `Registro ${log.id_registro || "-"}`,
      usuario: log.id_usuario ? `Usuario ${log.id_usuario}` : "sistema",
      data_hora: log.data_hora.toISOString(),
    }))
  );
}

module.exports = { getOverview, getFinance, getPartners, getAudit };
