const express = require('express');
const router = express.Router();

const materialController = require('./controllers/materialController');

router.get('/', (req, res) => {
  res.json({ message: 'API funcionando 🚀' });
});

router.get('/materiais', materialController.listarMateriais);

module.exports = router;
