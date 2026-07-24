const pool = require('../database/db');

// POST /api/purchases
async function registrarCompra(req, res) {
  const { materialId, weightKg, pricePerKg } = req.body;

  if (!materialId || weightKg == null || pricePerKg == null) {
    return res.status(400).json({ error: 'Campos obrigatórios: materialId, weightKg, pricePerKg.' });
  }

  if (weightKg <= 0) {
    return res.status(400).json({ error: 'O peso deve ser maior que zero.' });
  }

  try {
    // Verifica se material existe
    const mat = await pool.query('SELECT id, nome FROM material WHERE id = $1', [materialId]);
    if (mat.rowCount === 0) {
      return res.status(404).json({ error: 'Material não encontrado.' });
    }

    const result = await pool.query(
      `INSERT INTO compras (id_material, peso_kg, preco_kg)
       VALUES ($1, $2, $3)
       RETURNING id, id_material AS "materialId", peso_kg AS "weightKg",
                 preco_kg AS "pricePerKg", total AS "totalCost", criado_em AS "createdAt"`,
      [materialId, weightKg, pricePerKg]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('registrarCompra:', err.message);
    res.status(500).json({ error: 'Erro ao registrar compra.' });
  }
}

module.exports = { registrarCompra };
