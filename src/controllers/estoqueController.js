<<<<<<< HEAD
const prisma = require("../lib/prisma");
const { mapMaterial } = require("../lib/mappers");

async function listarEstoque(req, res) {
  const materiais = await prisma.material.findMany({
    where: { active: true },
    include: { stock: true },
    orderBy: { nome: "asc" },
  });

  res.json(materiais.map(mapMaterial));
}

module.exports = { listarEstoque };

=======
const pool = require("../database/db");

async function listarEstoque(req, res) {
  const result = await pool.query(`
    SELECT 
      m.id_material,
      m.nome,
      COALESCE(e.quantidade_kg, 0)::float8 AS quantidade_kg,
      m.preco_base::float8 AS preco_base
    FROM material m
    LEFT JOIN estoque e ON m.id_material = e.id_material
    WHERE m.ativo = TRUE
    ORDER BY m.nome ASC
  `);

  res.json(result.rows);
}

module.exports = { listarEstoque };
>>>>>>> 9bd93b89a5a1c31e2b7bfb0c84358369ca6f1f7d
