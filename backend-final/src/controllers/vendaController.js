const pool = require('../database/db');

// POST /api/sales
async function registrarVenda(req, res) {
  const { materialId, weightKg, pricePerKg } = req.body;

  if (!materialId || weightKg == null || pricePerKg == null) {
    return res.status(400).json({ error: 'Campos obrigatórios: materialId, weightKg, pricePerKg.' });
  }

  if (weightKg <= 0) {
    return res.status(400).json({ error: 'O peso deve ser maior que zero.' });
  }

  try {
    // Verifica se material existe
    const mat = await pool.query('SELECT id FROM material WHERE id = $1', [materialId]);
    if (mat.rowCount === 0) {
      return res.status(404).json({ error: 'Material não encontrado.' });
    }

    // Verifica saldo em estoque
    const estoqueRow = await pool.query(
      'SELECT quantidade_kg FROM estoque WHERE id_material = $1',
      [materialId]
    );
    const saldo = estoqueRow.rowCount > 0 ? parseFloat(estoqueRow.rows[0].quantidade_kg) : 0;

    if (saldo < weightKg) {
      return res.status(400).json({
        error: `Saldo insuficiente em estoque. Disponível: ${saldo.toFixed(3)} kg.`,
      });
    }

    const result = await pool.query(
      `INSERT INTO vendas (id_material, peso_kg, preco_kg)
       VALUES ($1, $2, $3)
       RETURNING id, id_material AS "materialId", peso_kg AS "weightKg",
                 preco_kg AS "pricePerKg", total AS "totalRevenue", criado_em AS "createdAt"`,
      [materialId, weightKg, pricePerKg]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('registrarVenda:', err.message);
    res.status(500).json({ error: 'Erro ao registrar venda.' });
  }
}

module.exports = { registrarVenda };
