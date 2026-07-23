const prisma = require("../lib/prisma");
const { toMoney, toNumber, toWeight } = require("../lib/number");

function validateTransactionPayload({ materialId, weightKg, pricePerKg }) {
  if (!materialId || weightKg == null || pricePerKg == null) {
    return "Campos materialId, weightKg e pricePerKg sao obrigatorios.";
  }

  if (toNumber(weightKg) <= 0 || toNumber(pricePerKg) < 0) {
    return "Peso deve ser maior que zero e preco nao pode ser negativo.";
  }

  return null;
}

async function registrarCompra(req, res) {
  const { materialId, weightKg, pricePerKg } = req.body;
  const validationError = validateTransactionPayload({ materialId, weightKg, pricePerKg });

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const weight = toWeight(weightKg);
  const price = toMoney(pricePerKg);
  const total = toMoney(weight * price);

  const compra = await prisma.$transaction(async (tx) => {
    const material = await tx.material.findFirst({
      where: { id: Number(materialId), active: true },
    });

    if (!material) {
      throw Object.assign(new Error("Material nao encontrado ou inativo."), { status: 404 });
    }

    const created = await tx.purchase.create({
      data: {
        materialId: Number(materialId),
        weightKg: weight,
        pricePerKg: price,
        total,
      },
    });

    await tx.stock.upsert({
      where: { materialId: Number(materialId) },
      update: { quantityKg: { increment: weight } },
      create: { materialId: Number(materialId), quantityKg: weight },
    });

    await tx.auditLog.create({
      data: {
        action: "Compra registrada",
        description: `${material.nome}: entrada de ${weight} kg a R$ ${price}/kg.`,
        userId: req.user.id,
      },
    });

    return created;
  });

  res.status(201).json({
    id: compra.id,
    materialId: compra.materialId,
    weightKg: toNumber(compra.weightKg),
    pricePerKg: toNumber(compra.pricePerKg),
    totalCost: toNumber(compra.total),
    createdAt: compra.createdAt,
  });
}

async function registrarVenda(req, res) {
  const { materialId, weightKg, pricePerKg } = req.body;
  const validationError = validateTransactionPayload({ materialId, weightKg, pricePerKg });

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const weight = toWeight(weightKg);
  const price = toMoney(pricePerKg);
  const total = toMoney(weight * price);

  const venda = await prisma.$transaction(async (tx) => {
    const material = await tx.material.findFirst({
      where: { id: Number(materialId), active: true },
      include: { stock: true },
    });

    if (!material) {
      throw Object.assign(new Error("Material nao encontrado ou inativo."), { status: 404 });
    }

    const saldoAtual = toNumber(material.stock?.quantityKg);
    if (saldoAtual < weight) {
      throw Object.assign(
        new Error(`Saldo insuficiente em estoque. Disponivel: ${saldoAtual.toFixed(3)} kg.`),
        { status: 400 }
      );
    }

    const created = await tx.sale.create({
      data: {
        materialId: Number(materialId),
        weightKg: weight,
        pricePerKg: price,
        total,
      },
    });

    await tx.stock.update({
      where: { materialId: Number(materialId) },
      data: { quantityKg: { decrement: weight } },
    });

    await tx.auditLog.create({
      data: {
        action: "Venda registrada",
        description: `${material.nome}: saida de ${weight} kg a R$ ${price}/kg.`,
        userId: req.user.id,
      },
    });

    return created;
  });

  res.status(201).json({
    id: venda.id,
    materialId: venda.materialId,
    weightKg: toNumber(venda.weightKg),
    pricePerKg: toNumber(venda.pricePerKg),
    totalRevenue: toNumber(venda.total),
    createdAt: venda.createdAt,
  });
}

module.exports = { registrarVenda, registrarCompra };

