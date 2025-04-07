require("dotenv").config(); // .env 파일 로드

const { Pool } = require("pg");
const { logger } = require("./logger");
const { formatMessage } = require("./logger");
const { messages } = require("./messages");

// PostgreSQL Connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on("connect", () => {
  logger.info(formatMessage(messages.db.connect));
});

pool.on("error", () => {
  logger.error(formatMessage(messages.error.failConnectDB));
});

// DB에 Ticker 데이터 저장
const saveTicker = async (exchangeId, baseSymbol, quoteSymbol, data) => {
  const query = `
    INSERT INTO tickers (
      timestamp, exchange, base_symbol, quote_symbol, open, high, low, close, last, previous_close,
      change, percentage, base_volume, quote_volume
    ) 
    VALUES (to_timestamp($1 / 1000.0), $2, $3, $4, $5, $6, $7, $8, $9, $10, 
    $11, $12, $13, $14)
    ON CONFLICT (timestamp, exchange, base_symbol, quote_symbol) DO NOTHING
  `;

  const values = [
    data.timestamp,
    exchangeId,
    baseSymbol,
    quoteSymbol,
    data.open,
    data.high,
    data.low,
    data.close,
    data.last,
    data.previousClose,
    data.change,
    data.percentage,
    data.baseVolume,
    data.quoteVolume,
  ];

  try {
    await pool.query(query, values);
  } catch (error) {
    logger.error(
      formatMessage(messages.error.failInsertTicker, { error: error.message }),
    );
  }
};

// DB에 Candle 데이터 저장
const saveCandle = async (exchangeId, baseSymbol, quoteSymbol, candle) => {
  const query = `
    INSERT INTO candles (
      timestamp, exchange, base_symbol, quote_symbol, timeframe, open, high, low, close, volume
    ) 
    VALUES (to_timestamp($1 / 1000.0), $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (timestamp, exchange, base_symbol, quote_symbol, timeframe) DO NOTHING
  `;

  const values = [
    candle.timestamp,
    exchangeId,
    baseSymbol,
    quoteSymbol,
    candle.timeframe,
    candle.open,
    candle.high,
    candle.low,
    candle.close,
    candle.volume
  ];

  try {
    await pool.query(query, values);
  } catch (error) {
    logger.error(
        formatMessage(messages.error.failInsertCandle, { error: error.message }),
    );
  }
};

// const saveCandles = async (exchangeId, baseSymbol, quoteSymbol, timeframe, candles) => {
//   if (!candles || candles.length === 0) return;
//
//   const size = 10;
//   for (let i = 0; i < candles.length; i += size) {
//     const chunk = candles.slice(i, i + size);
//     const queryPrefix = `
//       INSERT INTO candles (
//         timestamp, exchange, base_symbol, quote_symbol, timeframe,
//         open, high, low, close, volume
//       ) VALUES
//     `;
//
//     const valuePlaceholders = [];
//     const values = [];
//
//     chunk.forEach((candle, index) => {
//       const [timestamp, open, high, low, close, volume] = candle;
//       const baseIdx = index * 10;
//
//       valuePlaceholders.push(`(
//         to_timestamp($${baseIdx + 1} / 1000.0), $${baseIdx + 2}, $${baseIdx + 3}, $${baseIdx + 4}, $${baseIdx + 5},
//         $${baseIdx + 6}, $${baseIdx + 7}, $${baseIdx + 8}, $${baseIdx + 9}, $${baseIdx + 10}
//       )`);
//
//       values.push(
//           timestamp,
//           exchangeId,
//           baseSymbol,
//           quoteSymbol,
//           timeframe,
//           open,
//           high,
//           low,
//           close,
//           volume
//       );
//     });
//
//     const query = queryPrefix + valuePlaceholders.join(", ") + `
//       ON CONFLICT (timestamp, exchange, base_symbol, quote_symbol, timeframe) DO NOTHING
//     `;
//
//     try {
//       await pool.query(query, values);
//     } catch (error) {
//       logger.error(
//           formatMessage(messages.error.failInsertCandle, { error: error.message }),
//       );
//       console.error(error.stack);
//     }
//   }
// };

const saveCandles = async (exchangeId, baseSymbol, quoteSymbol, timeframe, candles) => {
  if (!candles || candles.length === 0) return;

  const queryPrefix = `
    INSERT INTO candles (
      timestamp, exchange, base_symbol, quote_symbol, timeframe,
      open, high, low, close, volume
    ) VALUES 
  `;

  // ($1, $2, ..., $10), ($11, $12, ..., $20), ...
  const valuePlaceholders = [];
  const values = [];

  candles.forEach((candle, index) => {
    const [timestamp, open, high, low, close, volume] = candle;
    const baseIdx = index * 10;

    valuePlaceholders.push(`(
      to_timestamp($${baseIdx + 1} / 1000.0), $${baseIdx + 2}, $${baseIdx + 3}, $${baseIdx + 4}, $${baseIdx + 5},
      $${baseIdx + 6}, $${baseIdx + 7}, $${baseIdx + 8}, $${baseIdx + 9}, $${baseIdx + 10}
    )`);

    values.push(
        timestamp,
        exchangeId,
        baseSymbol,
        quoteSymbol,
        timeframe,
        open,
        high,
        low,
        close,
        volume
    );
  });

  const query = queryPrefix + valuePlaceholders.join(", ") + `
    ON CONFLICT (timestamp, exchange, base_symbol, quote_symbol, timeframe) DO NOTHING
  `;

  try {
    await pool.query(query, values);
  } catch (error) {
    logger.error(
        formatMessage(messages.error.failInsertCandle, { error: error.message }),
    );
  }
};

// DB에 Trade 데이터 저장
const saveTrade = async (exchangeId, baseSymbol, quoteSymbol, data) => {
  const query = `
    INSERT INTO trades (
      timestamp, exchange, base_symbol, quote_symbol, trade_id, price, amount, cost, side
    ) 
    VALUES (to_timestamp($1 / 1000.0), $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (timestamp, exchange, base_symbol, quote_symbol) DO NOTHING
  `;

  const values = [
    data.timestamp,
    exchangeId,
    baseSymbol,
    quoteSymbol,
    data.id,
    data.price,
    data.amount,
    data.cost,
    data.side,
  ];

  try {
    await pool.query(query, values);
  } catch (error) {
    logger.error(
      formatMessage(messages.error.failInsertTrade, { error: values }),
    );
  }
};

const getLastSavedCandle = async (exchange, baseSymbol, timeframe) => {
  const query = `SELECT timestamp, exchange, base_symbol, timeframe
                          FROM candles
                          WHERE exchange = $1 AND base_symbol = $2 AND timeframe = $3
                          ORDER BY timestamp DESC
                          LIMIT 1;
                        `;
  const values = [
      exchange,
      baseSymbol,
      timeframe
  ];
  try {
    const { rows } = await pool.query(query, values);
    return rows.length ? rows[0] : null;
  } catch (error) {
    logger.error(
        formatMessage(messages.error.failReadCoin, { error: error.message }),
    );
  }
};

const getAllCoins = async () => {
  const query = "SELECT symbol, name FROM coins";

  try {
    const { rows } = await pool.query(query);
    return rows;
  } catch (error) {
    logger.error(
      formatMessage(messages.error.failReadCoin, { error: error.message }),
    );
  }
};

const saveCoins = async (coins) => {
  if (!coins.length) return;

  const values = coins
    .map((coin) => `('${coin.name}', '${coin.symbol}')`)
    .join(", ");
  const query = `
    INSERT INTO coins (
        name, symbol
    )
    VALUES ${values}
    ON CONFLICT (symbol) DO NOTHING
  `;

  try {
    await pool.query(query);
  } catch (error) {
    logger.error(
      formatMessage(messages.error.failInsertCoin, { error: error.message }),
    );
  }
};

const deleteCoins = async (coins) => {
  if (!coins.length) return;

  const symbols = coins.map((coin) => `'${coin.symbol}'`).join(", ");
  const query = `DELETE FROM coins WHERE symbol IN (${symbols});`;

  try {
    await pool.query(query);
  } catch (error) {
    logger.error(
      formatMessage(messages.error.failDeleteCoin, { error: error.message }),
    );
  }
};

const updateCoins = async (coins) => {
  if (!coins.length) return;

  const updates = coins
    .map((coin) => `WHEN '${coin.symbol}' THEN '${coin.name}'`)
    .join("\n ");
  const symbols = coins.map((coin) => `'${coin.symbol}'`).join(", ");

  const query = `
    UPDATE coins
    SET name = CASE symbol
      ${updates}
    END
    WHERE symbol IN (${symbols});
  `;

  try {
    await pool.query(query);
  } catch (error) {
    logger.error(
      formatMessage(messages.error.failUpdateCoin, { error: error.message }),
    );
  }
};

module.exports = {
  pool,
  saveTicker,
  saveTrade,
  saveCandle,
  saveCandles,
  getLastSavedCandle,
  getAllCoins,
  saveCoins,
  updateCoins,
  deleteCoins,
};
