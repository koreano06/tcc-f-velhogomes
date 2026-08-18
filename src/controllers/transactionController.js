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

async function getOrCreateDefaultFornecedor(tx) {
  const fornecedor = await tx.fornecedores.findFirst({ where: { ativo: true }, orderBy: { id_fornecedor: "asc" } });
  if (fornecedor) return fornecedor;
  return tx.fornecedores.create({ data: { nome: "Fornecedor Padrao" } });
}

async function getOrCreateDefaultCliente(tx) {
  const cliente = await tx.clientes.findFirst({ where: { ativo: true }, orderBy: { id_cliente: "asc" } });
  if (cliente) return cliente;
  return tx.clientes.create({ data: { nome: "Consumidor Final" } });
}

async function registrarCompra(req, res) {
  const { materialId, weightKg, pricePerKg } = req.body;
  const validationError = validateTransactionPayload({ materialId, weightKg, pricePerKg });
  if (validationError) return res.status(400).json({ error: validationError });

  const weight = toWeight(weightKg);
  const price = toMoney(pricePerKg);
  const total = toMoney(weight * price);
  const idMaterial = Number(materialId);

  const compra = await prisma.$transaction(async (tx) => {
    const material = await tx.materiais.findFirst({ where: { id_material: idMaterial, ativo: true } });
    if (!material) throw Object.assign(new Error("Material nao encontrado ou inativo."), { status: 404 });

    const fornecedor = await getOrCreateDefaultFornecedor(tx);
    const created = await tx.compras.create({
      data: {
        id_fornecedor: fornecedor.id_fornecedor,
        id_usuario: req.user.id,
        valor_total: total,
        itens_compra: {
          create: { id_material: idMaterial, peso_kg: weight, preco_kg: price },
        },
      },
      include: { itens_compra: true },
    });

    await tx.estoque.upsert({
      where: { id_material: idMaterial },
      update: { quantidade_kg: { increment: weight } },
      create: { id_material: idMaterial, quantidade_kg: weight },
    });

    await tx.movimentacoes_estoque.create({
      data: {
        id_material: idMaterial,
        tipo: "ENTRADA",
        quantidade_kg: weight,
        origem: "COMPRA",
        id_referencia: created.id_compra,
        id_usuario: req.user.id,
      },
    });

    return created;
  });

  res.status(201).json({
    id: compra.id_compra,
    materialId: idMaterial,
    weightKg: weight,
    pricePerKg: price,
    totalCost: total,
    createdAt: compra.criado_em,
  });
}

async function registrarVenda(req, res) {
  const { materialId, weightKg, pricePerKg } = req.body;
  const validationError = validateTransactionPayload({ materialId, weightKg, pricePerKg });
  if (validationError) return res.status(400).json({ error: validationError });

  const weight = toWeight(weightKg);
  const price = toMoney(pricePerKg);
  const total = toMoney(weight * price);
  const idMaterial = Number(materialId);

  const venda = await prisma.$transaction(async (tx) => {
    const material = await tx.materiais.findFirst({
      where: { id_material: idMaterial, ativo: true },
      include: { estoque: true },
    });
    if (!material) throw Object.assign(new Error("Material nao encontrado ou inativo."), { status: 404 });

    const saldoAtual = toNumber(material.estoque?.quantidade_kg);
    if (saldoAtual < weight) {
      throw Object.assign(new Error(`Saldo insuficiente. Disponivel: ${saldoAtual.toFixed(2)} kg.`), { status: 400 });
    }

    const cliente = await getOrCreateDefaultCliente(tx);
    const created = await tx.vendas.create({
      data: {
        id_cliente: cliente.id_cliente,
        id_usuario: req.user.id,
        valor_total: total,
        itens_venda: {
          create: { id_material: idMaterial, peso_kg: weight, preco_kg: price },
        },
      },
      include: { itens_venda: true },
    });

    await tx.estoque.update({
      where: { id_material: idMaterial },
      data: { quantidade_kg: { decrement: weight } },
    });

    await tx.movimentacoes_estoque.create({
      data: {
        id_material: idMaterial,
        tipo: "SAIDA",
        quantidade_kg: weight,
        origem: "VENDA",
        id_referencia: created.id_venda,
        id_usuario: req.user.id,
      },
    });

    return created;
  });

  res.status(201).json({
    id: venda.id_venda,
    materialId: idMaterial,
    weightKg: weight,
    pricePerKg: price,
    totalRevenue: total,
    createdAt: venda.criado_em,
  });
}

module.exports = { registrarVenda, registrarCompra };
