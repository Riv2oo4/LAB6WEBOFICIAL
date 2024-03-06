import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  port: 33067,
  user: 'root',
  database: 'UFCblog',
  password: 'riv22500',
});

export default pool;
