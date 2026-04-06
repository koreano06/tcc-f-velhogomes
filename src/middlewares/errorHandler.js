function notFoundHandler(req, res) {
  res.status(404).json({ error: "Rota nao encontrada." });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || "Erro interno do servidor.";

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ error: message });
}

module.exports = { notFoundHandler, errorHandler };
