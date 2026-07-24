<<<<<<< HEAD
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

=======
const db = require("../config/db");

async function tableExists(name) {
  const { rows } = await db.query("SELECT to_regclass($1) AS reg", [name]);
  return Boolean(rows[0] && rows[0].reg);
}

exports.getOverview = async (req, res) => {
  try {
    const query = `
      WITH compras AS (
        SELECT COALESCE(SUM(valor_total), 0) AS total
        FROM compra
        WHERE date_trunc('month', data) = date_trunc('month', now())
      ),
      vendas AS (
        SELECT COALESCE(SUM(valor_total), 0) AS total
        FROM venda
        WHERE date_trunc('month', data) = date_trunc('month', now())
      )
      SELECT
        c.total AS compras_mes,
        v.total AS vendas_mes,
        (v.total - c.total) AS lucro_mes,
        18.0::numeric AS giro_estoque_dias,
        0::int AS materiais_parados
      FROM compras c, vendas v;
    `;
    const { rows } = await db.query(query);
    const data = rows[0] || {};
    data.compras_mes = Number(data.compras_mes || 0);
    data.vendas_mes = Number(data.vendas_mes || 0);
    data.lucro_mes = Number(data.lucro_mes || 0);
    data.giro_estoque_dias = Number(data.giro_estoque_dias || 0);
    data.materiais_parados = Number(data.materiais_parados || 0);
    data.alertas = [];
    if (Number(data.materiais_parados) > 0) {
      data.alertas.push(`${data.materiais_parados} materiais sem giro > 30 dias`);
    }
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Erro ao carregar overview" });
  }
};

exports.getFinance = async (req, res) => {
  try {
    const hasContasPagar = await tableExists("public.contas_pagar");
    const hasContasReceber = await tableExists("public.contas_receber");
    const hasCaixa = await tableExists("public.caixa");

    let contasPagar = 0;
    let contasReceber = 0;
    let caixaDisponivel = 0;
    let inadimplencia = 0;
    let vencimentos = [];

    if (hasContasPagar) {
      const pagarResult = await db.query(`
        SELECT COALESCE(SUM(valor), 0) AS contas_pagar
        FROM contas_pagar
        WHERE status = 'aberto'
      `);
      contasPagar = Number(pagarResult.rows[0].contas_pagar || 0);

      const vencResult = await db.query(`
        SELECT descricao, to_char(vencimento, 'YYYY-MM-DD') AS vencimento, valor::float8 AS valor
        FROM contas_pagar
        WHERE status = 'aberto'
        ORDER BY vencimento ASC
        LIMIT 10
      `);
      vencimentos = vencResult.rows;
    }

    if (hasContasReceber) {
      const receberResult = await db.query(`
        SELECT
          COALESCE(SUM(CASE WHEN status = 'aberto' THEN valor ELSE 0 END), 0) AS contas_receber,
          COALESCE(SUM(CASE WHEN status = 'vencido' THEN valor ELSE 0 END), 0) AS inadimplencia
        FROM contas_receber
      `);
      contasReceber = Number(receberResult.rows[0].contas_receber || 0);
      inadimplencia = Number(receberResult.rows[0].inadimplencia || 0);
    }

    if (hasCaixa) {
      const caixaResult = await db.query(`
        SELECT COALESCE((SELECT saldo_atual FROM caixa ORDER BY id DESC LIMIT 1), 0) AS caixa_disponivel
      `);
      caixaDisponivel = Number(caixaResult.rows[0].caixa_disponivel || 0);
    }

    res.json({
      cards: {
        contas_pagar: contasPagar,
        contas_receber: contasReceber,
        caixa_disponivel: caixaDisponivel,
        inadimplencia,
      },
      vencimentos,
    });
  } catch (e) {
    res.status(500).json({ error: "Erro ao carregar financeiro" });
  }
};

exports.getPartners = async (req, res) => {
  try {
    const fornecedoresQ = `
      SELECT f.nome,
             COALESCE(SUM(ic.peso), 0) AS peso_total_kg,
             COALESCE(SUM(ic.subtotal), 0) AS valor_total
      FROM compra c
      JOIN fornecedor f ON f.id_fornecedor = c.id_fornecedor
      LEFT JOIN item_compra ic ON ic.id_compra = c.id_compra
      GROUP BY f.nome
      ORDER BY valor_total DESC
      LIMIT 10
    `;
    const clientesQ = `
      SELECT c.nome,
             COALESCE(SUM(iv.peso), 0) AS peso_total_kg,
             COALESCE(SUM(iv.subtotal), 0) AS valor_total
      FROM venda v
      JOIN cliente c ON c.id_cliente = v.id_cliente
      LEFT JOIN item_venda iv ON iv.id_venda = v.id_venda
      GROUP BY c.nome
      ORDER BY valor_total DESC
      LIMIT 10
    `;
    const [fornR, cliR] = await Promise.all([db.query(fornecedoresQ), db.query(clientesQ)]);
    res.json({
      fornecedores: fornR.rows.map((r) => ({
        nome: r.nome,
        peso_total_kg: Number(r.peso_total_kg || 0),
        valor_total: Number(r.valor_total || 0),
      })),
      clientes: cliR.rows.map((r) => ({
        nome: r.nome,
        peso_total_kg: Number(r.peso_total_kg || 0),
        valor_total: Number(r.valor_total || 0),
      })),
    });
  } catch (e) {
    res.status(500).json({ error: "Erro ao carregar parceiros" });
  }
};

exports.getAudit = async (req, res) => {
  try {
    const hasAudit = await tableExists("public.audit_logs");
    if (!hasAudit) {
      return res.json([]);
    }

    const q = `
      SELECT
        to_char(created_at,'YYYY-MM-DD HH24:MI:SS') AS data_hora,
        usuario,
        acao,
        descricao
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 50
    `;
    const { rows } = await db.query(q);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Erro ao carregar auditoria" });
  }
};
>>>>>>> 9bd93b89a5a1c31e2b7bfb0c84358369ca6f1f7d
