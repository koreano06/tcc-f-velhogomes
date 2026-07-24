const express = require('express');
const cors    = require('cors');

require('./database/db'); // inicializa conexão com o banco

const app = express();

app.use(cors());
app.use(express.json());

const routes = require('./routes');
app.use('/api', routes);

// Handler de erros global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err.message);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
