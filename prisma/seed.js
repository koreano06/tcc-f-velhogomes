require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const initialUsers = [
  { username: "gomes", pin: "1234", role: "owner", name: "Gomes" },
  { username: "joao", pin: "2222", role: "employee", name: "Joao" },
  { username: "consulta", pin: "0000", role: "viewer", name: "Consulta" },
];

async function main() {
  for (const user of initialUsers) {
    const passwordHash = await bcrypt.hash(user.pin, 10);

    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
        active: true,
      },
      create: {
        username: user.username,
        name: user.name,
        role: user.role,
        passwordHash,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Usuarios iniciais criados/atualizados com seguranca.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

