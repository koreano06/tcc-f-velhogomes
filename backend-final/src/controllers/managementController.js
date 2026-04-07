const pool = require('../database/db');

// GET /api/management/overview
async function getOverview(req, res) {
  try {
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

    const [comprasMes, vendasMes, estoqueRows] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(total), 0) AS total FROM compras WHERE criado_em >= $1`,
        [inicioMes]
      ),
      pool.query(
        `SELECT COALESCE(SUM(total), 0) AS total FROM vendas WHERE criado_em >= $1`,
        [inicioMes]
      ),
      pool.query(`
        SELECT
          m.id,
          m.nome,
          m.estoque_minimo_kg,
          COALESCE(e.quantidade_kg, 0) AS quantidade_kg
        FROM material m
        LEFT JOIN estoque e ON e.id_material = m.id
      `),
    ]);

    const compras = parseFloat(comprasMes.rows[0].total);
    const vendas  = parseFloat(vendasMes.rows[0].total);
    const lucro   = vendas - compras;

    // Giro: dias desde a compra mais antiga do mês até hoje
    const giroResult = await pool.query(
      `SELECT EXTRACT(DAY FROM (NOW() - MIN(criado_em))) AS dias FROM compras WHERE criado_em >= $1`,
      [inicioMes]
    );
    const giroDias = parseFloat(giroResult.rows[0].dias ?? 0);

    // Materiais parados: sem compras ou vendas nos últimos 30 dias
    const paradosResult = await pool.query(`
      SELECT COUNT(*) AS total
      FROM material m
      WHERE NOT EXISTS (
        SELECT 1 FROM compras c WHERE c.id_material = m.id AND c.criado_em >= NOW() - INTERVAL '30 days'
      )
      AND NOT EXISTS (
        SELECT 1 FROM vendas v WHERE v.id_material = m.id AND v.criado_em >= NOW() - INTERVAL '30 days'
      )
    `);

    // Alertas: materiais abaixo do estoque mínimo
    const alertas = estoqueRows.rows
      .filter(m => m.estoque_minimo_kg > 0 && parseFloat(m.quantidade_kg) <= parseFloat(m.estoque_minimo_kg))
      .map(m => `${m.nome}: ${parseFloat(m.quantidade_kg).toFixed(2)} kg em estoque (mínimo: ${parseFloat(m.estoque_minimo_kg).toFixed(2)} kg).`);

    res.json({
      compras_mes:        compras,
      vendas_mes:         vendas,
      lucro_mes:          lucro,
      giro_estoque_dias:  giroDias,
      materiais_parados:  parseInt(paradosResult.rows[0].total),
      alertas,
    });
  } catch (err) {
    console.error('getOverview:', err.message);
    res.status(500).json({ error: 'Erro ao buscar overview.' });
  }
}

// GET /api/management/finance
async function getFinance(req, res) {
  try {
    const [vendasTotal, comprasTotal] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(total), 0) AS total FROM vendas`),
      pool.query(`SELECT COALESCE(SUM(total), 0) AS total FROM compras`),
    ]);

    const totalVendas  = parseFloat(vendasTotal.rows[0].total);
    const totalCompras = parseFloat(comprasTotal.rows[0].total);
    const caixa        = totalVendas - totalCompras;

    // Próximos vencimentos (simulado com últimas compras ainda não pagas — adapte se tiver tabela financeira)
    const vencimentos = await pool.query(`
      SELECT
        m.nome AS descricao,
        TO_CHAR(c.criado_em + INTERVAL '30 days', 'DD/MM/YYYY') AS vencimento,
        c.total AS valor
      FROM compras c
      JOIN material m ON m.id = c.id_material
      ORDER BY c.criado_em DESC
      LIMIT 6
    `);

    res.json({
      cards: {
        contas_pagar:     totalCompras,
        contas_receber:   totalVendas,
        caixa_disponivel: caixa,
        inadimplencia:    0,
      },
      vencimentos: vencimentos.rows,
    });
  } catch (err) {
    console.error('getFinance:', err.message);
    res.status(500).json({ error: 'Erro ao buscar resumo financeiro.' });
  }
}

// GET /api/management/partners
async function getPartners(req, res) {
  try {
    const [fornecedores, clientes] = await Promise.all([
      // Fornecedores = agrupamento por material nas compras
      pool.query(`
        SELECT
          m.nome,
          SUM(c.peso_kg)  AS peso_total_kg,
          SUM(c.total)    AS valor_total
        FROM compras c
        JOIN material m ON m.id = c.id_material
        GROUP BY m.id, m.nome
        ORDER BY valor_total DESC
        LIMIT 10
      `),
      // Clientes = agrupamento por material nas vendas
      pool.query(`
        SELECT
          m.nome,
          SUM(v.peso_kg)  AS peso_total_kg,
          SUM(v.total)    AS valor_total
        FROM vendas v
        JOIN material m ON m.id = v.id_material
        GROUP BY m.id, m.nome
        ORDER BY valor_total DESC
        LIMIT 10
      `),
    ]);

    res.json({
      fornecedores: fornecedores.rows,
      clientes:     clientes.rows,
    });
  } catch (err) {
    console.error('getPartners:', err.message);
    res.status(500).json({ error: 'Erro ao buscar parceiros.' });
  }
}

// GET /api/management/audit
async function getAudit(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        acao,
        descricao,
        usuario,
        TO_CHAR(data_hora, 'DD/MM/YYYY HH24:MI:SS') AS data_hora
      FROM auditoria
      ORDER BY data_hora DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('getAudit:', err.message);
    res.status(500).json({ error: 'Erro ao buscar auditoria.' });
  }
}

module.exports = { getOverview, getFinance, getPartners, getAudit };
