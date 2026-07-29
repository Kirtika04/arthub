const mysql = require('mysql2/promise');
const requireDotenv = require('dotenv');

requireDotenv.config();

// Create a connection pool for better performance and resource management
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection on startup
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('MySQL Database connected successfully.');
        connection.release();
    } catch (error) {
        console.error('MySQL Database connection failed:', error.message);
        process.exit(1);
    }
})();

module.exports = pool;
