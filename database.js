import mysql from 'mysql2/promise';

// Configure MySQL connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'chapaintegrate', // Replace with your MySQL username
  password: 'chapaintegrate', // Replace with your MySQL password
  database: 'chapaintegrate', // Replace with your MySQL database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Query function to execute SQL queries
async function query(text, params) {
  const [rows] = await pool.execute(text, params);
  return rows;
}

export { query };
