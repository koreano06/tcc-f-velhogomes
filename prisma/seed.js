require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const profiles = [
  { nome: "ADMIN", descricao: "Acesso completo ao sistema" },
  { nome: "OPERADOR", descricao: "Registra compras, vendas e consulta estoque" },
  { nome: "LEITURA", descricao: "Consulta dados operacionais sem alterar" },
];

const users = [
  { nome: "gomes", email: "gomes@sistema.local", pin: "1234", perfil: "ADMIN" },
  { nome: "joao", email: "joao@sistema.local", pin: "2222", perfil: "OPERADOR" },
  { nome: "consulta", email: "consulta@sistema.local", pin: "0000", perfil: "LEITURA" },
];

async function main() {
  for (const profile of profiles) {
    await prisma.perfis.upsert({
      where: { nome: profile.nome },
      update: { descricao: profile.descricao },
      create: profile,
    });
  }

  const profileRows = await prisma.perfis.findMany();
  const profileIds = new Map(profileRows.map((profile) => [profile.nome, profile.id_perfil]));

  for (const user of users) {
    const senhaHash = await bcrypt.hash(user.pin, 10);

    await prisma.usuarios.upsert({
      where: { email: user.email },
      update: {
        nome: user.nome,
        senha_hash: senhaHash,
        id_perfil: profileIds.get(user.perfil),
        ativo: true,
      },
      create: {
        nome: user.nome,
        email: user.email,
        senha_hash: senhaHash,
        id_perfil: profileIds.get(user.perfil),
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Perfis e usuarios iniciais criados/atualizados.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
