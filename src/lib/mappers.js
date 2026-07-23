const { toNumber } = require("./number");

function mapMaterial(material) {
  const stock = material.stock || {};

  return {
    id: material.id,
    nome: material.nome,
    preco_compra_kg: toNumber(material.precoCompraKg),
    preco_venda_kg: toNumber(material.precoVendaKg),
    estoque_minimo_kg: toNumber(material.estoqueMinimoKg),
    quantidade_kg: toNumber(stock.quantityKg),
    ativo: material.active,
  };
}

function mapUser(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };
}

module.exports = { mapMaterial, mapUser };
