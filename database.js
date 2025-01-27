import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

// Configure MySQL connection using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST, // MySQL host from .env
  user: process.env.DB_USER, // MySQL username from .env
  password: process.env.DB_PASSWORD, // MySQL password from .env
  database: process.env.DB_NAME, // MySQL database name from .env
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
