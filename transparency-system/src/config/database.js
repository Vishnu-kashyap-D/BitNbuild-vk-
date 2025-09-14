require('dotenv').config();

// Use SQLite by default for easier setup
const dbType = process.env.DB_TYPE || 'sqlite';

if (dbType === 'sqlite') {
  // Use SQLite for development
  console.log('Using SQLite database for development');
  const sqliteDb = require('./database-sqlite');
  module.exports = sqliteDb;
} else {
  // Use PostgreSQL for production
  console.log('Using PostgreSQL database');
  const { Pool } = require('pg');
  
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'transparency_system',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  // Test the connection
  pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
  });
  
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await pool.end();
    process.exit(0);
  });
  
  module.exports = pool;
}
