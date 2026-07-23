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

  const user = await prisma.user.findUnique({
    where: { username: String(username).trim().toLowerCase() },
  });

  if (!user || !user.active) {
    return res.status(401).json({ error: "Usuario ou PIN invalido." });
  }

  const validPassword = await bcrypt.compare(String(pin), user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: "Usuario ou PIN invalido." });
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, getJwtSecret(), { expiresIn: "8h" });

  res.json({
    token,
    user: mapUser(user),
  });
}

async function me(req, res) {
  res.json({ user: mapUser(req.user) });
}

module.exports = { login, me };

