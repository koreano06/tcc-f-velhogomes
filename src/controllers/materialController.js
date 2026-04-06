const pool = require("../database/db");

async function listarMateriais(req, res) {
  const result = await pool.query(
    `SELECT id_material, nome, preco_base AS preco_kg, ativo
     FROM material
     WHERE ativo = TRUE
     ORDER BY nome ASC`
  );
  res.json(result.rows);
}

async function criarMaterial(req, res) {
  const { nome, preco_kg } = req.body;

  if (!nome || preco_kg == null) {
    return res.status(400).json({ error: "Campos nome e preco_kg sao obrigatorios." });
  }

  const result = await pool.query(
    `INSERT INTO material (nome, preco_base, ativo)
     VALUES ($1, $2, TRUE)
     RETURNING id_material, nome, preco_base AS preco_kg, ativo`,
    [nome, preco_kg]
  );

  res.status(201).json(result.rows[0]);
}

async function atualizarMaterial(req, res) {
  const { id } = req.params;
  const { nome, preco_kg } = req.body;

  if (!nome || preco_kg == null) {
    return res.status(400).json({ error: "Campos nome e preco_kg sao obrigatorios." });
  }

  const result = await pool.query(
    `UPDATE material
     SET nome = $1, preco_base = $2
     WHERE id_material = $3
     RETURNING id_material, nome, preco_base AS preco_kg, ativo`,
    [nome, preco_kg, id]
  );

  if (!result.rows.length) {
    return res.status(404).json({ error: "Material nao encontrado." });
  }

  res.json(result.rows[0]);
}

async function desativarMaterial(req, res) {
  const { id } = req.params;

  const result = await pool.query(
    `UPDATE material
     SET ativo = FALSE
     WHERE id_material = $1
     RETURNING id_material`,
    [id]
  );

  if (!result.rows.length) {
    return res.status(404).json({ error: "Material nao encontrado." });
  }

  res.json({ message: "Material removido com sucesso." });
}

module.exports = {
  listarMateriais,
  criarMaterial,
  atualizarMaterial,
  desativarMaterial,
};
