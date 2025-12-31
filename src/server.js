const express = require('express');
const cors = require('cors');

require('./database/db'); // força conexão com o banco

const app = express();
app.use(cors());
app.use(express.json());

const routes = require('./routes');
app.use('/api', routes);

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
