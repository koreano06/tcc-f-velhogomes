const { toNumber } = require("./number");

function mapMaterial(material) {
  const stock = material.estoque || {};

  return {
    id: material.id_material,
    nome: material.nome,
    preco_compra_kg: toNumber(material.preco_compra_kg),
    preco_venda_kg: toNumber(material.preco_venda_kg),
    estoque_minimo_kg: toNumber(material.estoque_minimo_kg),
    quantidade_kg: toNumber(stock.quantidade_kg),
    ativo: material.ativo,
  };
}

function mapUser(user) {
  const roleByProfile = {
    ADMIN: "owner",
    OPERADOR: "employee",
    LEITURA: "viewer",
  };

  return {
    id: user.id_usuario,
    username: user.email,
    name: user.nome,
    role: roleByProfile[user.perfis?.nome] || "viewer",
  };
}

module.exports = { mapMaterial, mapUser };
