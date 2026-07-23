const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");

  if (!token) {
    return res.status(401).json({ error: "Token de acesso nao informado." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } });

    if (!user || !user.active) {
      return res.status(401).json({ error: "Sessao invalida." });
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Sessao expirada ou invalida." });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Perfil sem permissao para esta acao." });
    }

    next();
  };
}

module.exports = { authenticate, authorize };

