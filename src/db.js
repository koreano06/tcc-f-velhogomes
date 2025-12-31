const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'SUA_SENHA_DO_POSTGRES',
  database: 'f_velhogomes',
  port: 5432
});

module.exports = pool;
