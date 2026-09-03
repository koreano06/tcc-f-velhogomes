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

async function obterFornecedor(tx, fornecedorId) {
  if (fornecedorId) {
    const fornecedor = await tx.fornecedores.findFirst({
      where: { id_fornecedor: Number(fornecedorId), ativo: true },
    });
    if (!fornecedor) throw Object.assign(new Error("Fornecedor nao encontrado ou inativo."), { status: 404 });
    return fornecedor;
  }

  const fornecedorPadrao = await tx.fornecedores.findUnique({ where: { documento: "NAO_INFORMADO" } });
  if (!fornecedorPadrao?.ativo) {
    throw Object.assign(new Error("Fornecedor padrao indisponivel. Execute a carga inicial do banco."), { status: 500 });
  }
  return fornecedorPadrao;
}

async function obterCliente(tx, clienteId) {
  if (clienteId) {
    const cliente = await tx.clientes.findFirst({
      where: { id_cliente: Number(clienteId), ativo: true },
    });
    if (!cliente) throw Object.assign(new Error("Cliente nao encontrado ou inativo."), { status: 404 });
    return cliente;
  }

  const clienteBalcao = await tx.clientes.findUnique({ where: { documento: "CONSUMIDOR_BALCAO" } });
  if (!clienteBalcao?.ativo) {
    throw Object.assign(new Error("Cliente de balcao indisponivel. Execute a carga inicial do banco."), { status: 500 });
  }
  return clienteBalcao;
}

async function registrarCompra(req, res) {
  const { materialId, weightKg, pricePerKg, fornecedorId } = req.body;
  const validationError = validateTransactionPayload({ materialId, weightKg, pricePerKg });
  if (validationError) return res.status(400).json({ error: validationError });

  const weight = toWeight(weightKg);
  const price = toMoney(pricePerKg);
  const total = toMoney(weight * price);
  const idMaterial = Number(materialId);

  const compra = await prisma.$transaction(async (tx) => {
    const material = await tx.materiais.findFirst({ where: { id_material: idMaterial, ativo: true } });
    if (!material) throw Object.assign(new Error("Material nao encontrado ou inativo."), { status: 404 });

    const fornecedor = await obterFornecedor(tx, fornecedorId);
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

    await tx.auditoria.create({
      data: {
        tabela: "compras",
        operacao: "INSERT",
        id_registro: created.id_compra,
        id_usuario: req.user.id,
        dados_novos: { materialId: idMaterial, pesoKg: weight, precoKg: price, fornecedorId: fornecedor.id_fornecedor },
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
  const { materialId, weightKg, pricePerKg, clienteId } = req.body;
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

    const cliente = await obterCliente(tx, clienteId);
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

    await tx.auditoria.create({
      data: {
        tabela: "vendas",
        operacao: "INSERT",
        id_registro: created.id_venda,
        id_usuario: req.user.id,
        dados_novos: { materialId: idMaterial, pesoKg: weight, precoKg: price, clienteId: cliente.id_cliente },
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
