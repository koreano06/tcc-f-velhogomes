const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { mapUser } = require("../lib/mappers");

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw Object.assign(new Error("JWT_SECRET nao configurado no backend."), { status: 500 });
  }
  return process.env.JWT_SECRET;
}

async function login(req, res) {
  const { username, pin } = req.body;

  if (!username || !pin) {
    return res.status(400).json({ error: "Informe usuario e PIN." });
  }

  const login = String(username).trim().toLowerCase();
  const user = await prisma.usuarios.findFirst({
    where: {
      OR: [
        { email: login },
        { nome: { equals: login, mode: "insensitive" } },
      ],
    },
    include: { perfis: true },
  });

  if (!user || !user.ativo) {
    return res.status(401).json({ error: "Usuario ou PIN invalido." });
  }

  const validPassword = await bcrypt.compare(String(pin), user.senha_hash);
  if (!validPassword) {
    return res.status(401).json({ error: "Usuario ou PIN invalido." });
  }

  const mappedUser = mapUser(user);
  const token = jwt.sign({ sub: user.id_usuario, role: mappedUser.role }, getJwtSecret(), { expiresIn: "8h" });

  res.json({
    token,
    user: mappedUser,
  });
}

async function me(req, res) {
  const user = await prisma.usuarios.findUnique({
    where: { id_usuario: req.user.id },
    include: { perfis: true },
  });

  if (!user) {
    return res.status(404).json({ error: "Usuario nao encontrado." });
  }

  res.json({ user: mapUser(user) });
}

module.exports = { login, me };
