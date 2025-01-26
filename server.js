import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { query } from './database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import axios from 'axios';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8001;
const CHAPA_AUTH_KEY = process.env.CHAPA_AUTH_KEY; // Replace with your Chapa secret key

// Database setup
(async function setupDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost', // Replace with your database host
      user: 'chapaintegrate',      // Replace with your database username
      password: 'chapaintegrate',      // Replace with your database password
      database: 'chapaintegrate',
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

    await connection.query('CREATE DATABASE IF NOT EXISTS chapaintegrate');
    await connection.query('USE chapaintegrate');
    await connection.query(createTableQuery);

    console.log('Database and users table ensured.');
  } catch (error) {
    console.error('Error setting up database:', error.message);
    process.exit(1);
  }
})();

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (result.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const payload = { userId: user.username };
    const secret = process.env.JWT_SECRET || 'your-secret-key'; // Replace with a strong secret key
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    return res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error during login:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Registration route
app.post('/register', async (req, res) => {
  const { email, password, username, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      'INSERT INTO users (email, password, username, roles) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, username, role]
    );

    res.status(201).json({ message: 'User created successfully', user: result });
  } catch (error) {
    console.error('Error creating user:', error.message);
    return res.status(500).json({ message: 'Error creating user' });
  }
});

// Payment route
app.post('/accept-payment', async (req, res) => {
  const {
    amount,
    currency,
    email,
    first_name,
    last_name,
    phone_number,
    tx_ref,
  } = req.body;

  try {
    const header = {
      headers: {
        Authorization: `Bearer ${CHAPA_AUTH_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const body = {
      amount,
      currency,
      email,
      first_name,
      last_name,
      phone_number,
      tx_ref,
     };

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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Server Date And Time:', new Date().toISOString());
});
