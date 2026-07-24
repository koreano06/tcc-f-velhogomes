<<<<<<< HEAD
const prisma = require("../lib/prisma");
const { mapMaterial } = require("../lib/mappers");
const { toMoney, toWeight } = require("../lib/number");

async function listarMateriais(req, res) {
  const materiais = await prisma.material.findMany({
    where: { active: true },
    include: { stock: true },
    orderBy: { nome: "asc" },
  });

  res.json(materiais.map(mapMaterial));
}

async function criarMaterial(req, res) {
  const { nome, preco_compra_kg, preco_venda_kg, estoque_minimo_kg } = req.body;

  if (!nome || preco_compra_kg == null || preco_venda_kg == null) {
    return res.status(400).json({ error: "Campos nome, preco_compra_kg e preco_venda_kg sao obrigatorios." });
  }

  const material = await prisma.$transaction(async (tx) => {
    const created = await tx.material.create({
      data: {
        nome: String(nome).trim(),
        precoCompraKg: toMoney(preco_compra_kg),
        precoVendaKg: toMoney(preco_venda_kg),
        estoqueMinimoKg: toWeight(estoque_minimo_kg || 0),
        stock: { create: { quantityKg: 0 } },
      },
      include: { stock: true },
    });

    await tx.auditLog.create({
      data: {
        action: "Material cadastrado",
        description: `${created.nome} adicionado ao sistema.`,
        userId: req.user.id,
      },
    });

    return created;
  });

  res.status(201).json(mapMaterial(material));
}

async function atualizarMaterial(req, res) {
  const id = Number(req.params.id);
  const { nome, preco_compra_kg, preco_venda_kg, estoque_minimo_kg } = req.body;

  const material = await prisma.$transaction(async (tx) => {
    const updated = await tx.material.update({
      where: { id },
      data: {
        ...(nome != null ? { nome: String(nome).trim() } : {}),
        ...(preco_compra_kg != null ? { precoCompraKg: toMoney(preco_compra_kg) } : {}),
        ...(preco_venda_kg != null ? { precoVendaKg: toMoney(preco_venda_kg) } : {}),
        ...(estoque_minimo_kg != null ? { estoqueMinimoKg: toWeight(estoque_minimo_kg) } : {}),
      },
      include: { stock: true },
    });

    await tx.auditLog.create({
      data: {
        action: "Material atualizado",
        description: `${updated.nome} atualizado no cadastro.`,
        userId: req.user.id,
      },
    });

    return updated;
  });

  res.json(mapMaterial(material));
}

async function desativarMaterial(req, res) {
  const id = Number(req.params.id);

  const material = await prisma.$transaction(async (tx) => {
    const updated = await tx.material.update({
      where: { id },
      data: { active: false },
    });

    await tx.auditLog.create({
      data: {
        action: "Material desativado",
        description: `${updated.nome} saiu da lista ativa sem apagar o historico.`,
        userId: req.user.id,
      },
    });

    return updated;
  });

  res.json({ message: "Material desativado com sucesso.", id: material.id });
=======
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
>>>>>>> 9bd93b89a5a1c31e2b7bfb0c84358369ca6f1f7d
}

module.exports = {
  listarMateriais,
  criarMaterial,
  atualizarMaterial,
  desativarMaterial,
};
<<<<<<< HEAD

=======
>>>>>>> 9bd93b89a5a1c31e2b7bfb0c84358369ca6f1f7d
