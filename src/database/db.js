const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '0606',
  database: 'f_velhogomes',
  port: 5432,
});

module.exports = pool;
