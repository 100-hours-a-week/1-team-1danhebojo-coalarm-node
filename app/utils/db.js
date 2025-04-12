require("dotenv").config(); // .env 파일 로드

const { ReconnectingClient } = require("./reconnectClient");

// PostgreSQL Connection Pool;
let pool;

if (!pool) {
  pool = new ReconnectingClient({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
}

module.exports = pool;