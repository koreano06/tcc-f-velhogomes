const pool = require('../database/db');

async function listarMateriais(req, res) {
  try {
    const result = await pool.query('SELECT * FROM material');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar materiais:', error.message);
    res.status(500).json({ error: 'Erro ao buscar materiais' });
  }
}

module.exports = {
  listarMateriais
};
