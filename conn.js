import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'mysql',
  port: 3306,
  user: 'root',
  database: 'UFCblog',
  password: 'riv22500',
});

export default pool;
