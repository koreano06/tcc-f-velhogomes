function notFoundHandler(req, res) {
  res.status(404).json({ error: "Rota nao encontrada." });
}

function errorHandler(err, req, res, next) {
<<<<<<< HEAD
  const notFoundByPrisma = err.code === "P2025";
  const status = notFoundByPrisma ? 404 : err.status || 500;
  const message = notFoundByPrisma ? "Registro nao encontrado." : err.message || "Erro interno do servidor.";
=======
  const status = err.status || 500;
  const message = err.message || "Erro interno do servidor.";
>>>>>>> 9bd93b89a5a1c31e2b7bfb0c84358369ca6f1f7d

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ error: message });
}

module.exports = { notFoundHandler, errorHandler };
