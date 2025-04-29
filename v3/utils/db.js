require("dotenv").config(); // .env 파일 로드
const { Pool } = require("pg");
const { logger } = require("./logger");

// PostgreSQL Connection Pool;
let pool;

if (!pool) {
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: process.env.DB_MAX_CONNECTION
  });

  pool.connect()
      .then(client => {
        logger.info("[PostgreSQL] DB 연결 성공");
        client.release();
      })
      .catch(err => {
        logger.error("[PostgreSQL] DB 연결 실패:", err.stack);
        process.exit(1);
      });

}

module.exports = pool;