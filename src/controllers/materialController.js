const prisma = require("../lib/prisma");
const { mapMaterial } = require("../lib/mappers");
const { toMoney, toWeight } = require("../lib/number");

async function listarMateriais(req, res) {
  const materiais = await prisma.materiais.findMany({
    where: { ativo: true },
    include: { estoque: true },
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
    const created = await tx.materiais.create({
      data: {
        nome: String(nome).trim(),
        preco_compra_kg: toMoney(preco_compra_kg),
        preco_venda_kg: toMoney(preco_venda_kg),
        estoque_minimo_kg: toWeight(estoque_minimo_kg || 0),
        estoque: { create: { quantidade_kg: 0 } },
      },
      include: { estoque: true },
    });
    await tx.auditoria.create({
      data: { tabela: "materiais", operacao: "INSERT", id_registro: created.id_material, id_usuario: req.user.id },
    });
    return created;
  });
  res.status(201).json(mapMaterial(material));
}

async function atualizarMaterial(req, res) {
  const id = Number(req.params.id);
  const { nome, preco_compra_kg, preco_venda_kg, estoque_minimo_kg } = req.body;
  const material = await prisma.$transaction(async (tx) => {
    const updated = await tx.materiais.update({
      where: { id_material: id },
      data: {
        ...(nome != null ? { nome: String(nome).trim() } : {}),
        ...(preco_compra_kg != null ? { preco_compra_kg: toMoney(preco_compra_kg) } : {}),
        ...(preco_venda_kg != null ? { preco_venda_kg: toMoney(preco_venda_kg) } : {}),
        ...(estoque_minimo_kg != null ? { estoque_minimo_kg: toWeight(estoque_minimo_kg) } : {}),
      },
      include: { estoque: true },
    });
    await tx.auditoria.create({
      data: { tabela: "materiais", operacao: "UPDATE", id_registro: updated.id_material, id_usuario: req.user.id },
    });
    return updated;
  });
  res.json(mapMaterial(material));
}

async function desativarMaterial(req, res) {
  const id = Number(req.params.id);
  const material = await prisma.$transaction(async (tx) => {
    const updated = await tx.materiais.update({ where: { id_material: id }, data: { ativo: false } });
    await tx.auditoria.create({
      data: { tabela: "materiais", operacao: "UPDATE", id_registro: updated.id_material, id_usuario: req.user.id },
    });
    return updated;
  });
  res.json({ message: "Material desativado com sucesso.", id: material.id_material });
}

module.exports = { listarMateriais, criarMaterial, atualizarMaterial, desativarMaterial };
