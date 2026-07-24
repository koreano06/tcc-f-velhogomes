const pool = require("../database/db");

async function dashboard(req, res) {
  const [comprasResult, vendasResult, estoqueResult, detalhesMateriais] = await Promise.all([
    pool.query(`SELECT COALESCE(SUM(valor_total), 0) AS total FROM compra`),
    pool.query(`SELECT COALESCE(SUM(valor_total), 0) AS total FROM venda`),
    pool.query(`SELECT COALESCE(SUM(quantidade_kg), 0) AS total FROM estoque`),
    pool.query(`
      SELECT m.nome, CAST(e.quantidade_kg AS FLOAT) AS quantidade_kg
      FROM estoque e
      JOIN material m ON m.id_material = e.id_material
      WHERE e.quantidade_kg > 0
      ORDER BY e.quantidade_kg DESC
    `),
  ]);

  const compras = Number(comprasResult.rows[0].total);
  const vendas = Number(vendasResult.rows[0].total);
  const estoque = Number(estoqueResult.rows[0].total);

  res.json({
    compras_mes: compras,
    vendas_mes: vendas,
    lucro_mes: vendas - compras,
    estoque_total: estoque,
    detalhes_materiais: detalhesMateriais.rows,
  });
}

module.exports = { dashboard };
