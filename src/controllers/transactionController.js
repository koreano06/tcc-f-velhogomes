const pool = require("../database/db");

async function registrarVenda(req, res) {
  const { materialId, weightKg, pricePerKg } = req.body;

  if (!materialId || !weightKg || !pricePerKg) {
    return res.status(400).json({ error: "Campos materialId, weightKg e pricePerKg sao obrigatorios." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const valorTotal = Number(weightKg) * Number(pricePerKg);
    const vendaResult = await client.query(
      `INSERT INTO venda (data, valor_total, id_cliente, id_usuario)
       VALUES (CURRENT_TIMESTAMP, $1, 1, 1)
       RETURNING id_venda`,
      [valorTotal]
    );

    const idVenda = vendaResult.rows[0].id_venda;
    await client.query(
      `INSERT INTO item_venda (id_venda, id_material, preco_kg, peso, subtotal)
       VALUES ($1, $2, $3, $4, $5)`,
      [idVenda, materialId, pricePerKg, weightKg, valorTotal]
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Venda registrada com sucesso!", id_venda: idVenda });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function registrarCompra(req, res) {
  const { materialId, weightKg, pricePerKg } = req.body;

  if (!materialId || !weightKg || !pricePerKg) {
    return res.status(400).json({ error: "Campos materialId, weightKg e pricePerKg sao obrigatorios." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const valorTotal = Number(weightKg) * Number(pricePerKg);
    const compraResult = await client.query(
      `INSERT INTO compra (data, valor_total, id_usuario, id_fornecedor)
       VALUES (CURRENT_TIMESTAMP, $1, 1, 1)
       RETURNING id_compra`,
      [valorTotal]
    );

    const idCompra = compraResult.rows[0].id_compra;
    await client.query(
      `INSERT INTO item_compra (id_compra, id_material, preco_kg, peso, subtotal)
       VALUES ($1, $2, $3, $4, $5)`,
      [idCompra, materialId, pricePerKg, weightKg, valorTotal]
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Compra registrada com sucesso!", id_compra: idCompra });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { registrarVenda, registrarCompra };
