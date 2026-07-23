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
}

module.exports = {
  listarMateriais,
  criarMaterial,
  atualizarMaterial,
  desativarMaterial,
};

