import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();
app.use(bodyParser.json());
// Modify CORS to only allow requests from your frontend domain
app.use(cors({
  origin: 'https://linaagencyvip.vercel.app', // Your frontend URL
}));
app.use(express.json());

const PORT = 3000;
const CHAPA_AUTH_KEY = process.env.CHAPA_AUTH_KEY;
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

// Database setup
(async function setupDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
    });

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          username VARCHAR(50) NOT NULL,
          roles VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
    await connection.query(`USE ${DB_NAME}`);
    await connection.query(createTableQuery);

    console.log('Database and users table ensured.');
  } catch (error) {
    console.error('Error setting up database:', error.message);
    process.exit(1);
  }
})();

app.get('/', (req, res) => {
  res.send('Welcome to the backend!');
});


// Payment route
app.post('/accept-payment', async (req, res) => {
  const { amount, currency, email, first_name, last_name, phone_number, tx_ref } = req.body;

  try {
    const header = {
      headers: {
        Authorization: `Bearer ${CHAPA_AUTH_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const body = { amount, currency, email, first_name, last_name, phone_number, tx_ref };

    const response = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      body,
      header
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error initializing payment:', error.message);
    res.status(400).json({ message: 'Payment initialization failed', error: error.message });
  }
});


// Server start
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Server Date And Time:', new Date().toISOString());
});
