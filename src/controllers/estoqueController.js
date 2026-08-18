const prisma = require("../lib/prisma");
const { mapMaterial } = require("../lib/mappers");
async function listarEstoque(req, res) {
  const materiais = await prisma.materiais.findMany({
    where: { ativo: true },
    include: { estoque: true },
    orderBy: { nome: "asc" },
  });
  res.json(materiais.map(mapMaterial));
}
module.exports = { listarEstoque };
