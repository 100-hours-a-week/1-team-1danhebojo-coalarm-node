const pool = require('./db');
const { logger } = require("./logger");

// DB에 티커 데이터 저장
const saveTicker = async (exchangeId, baseSymbol, quoteSymbol, ticker) => {
    if (!ticker) return;

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
        ticker.timestamp,
        exchangeId,
        baseSymbol,
        quoteSymbol,
        ticker.open,
        ticker.high,
        ticker.low,
        ticker.close,
        ticker.last,
        ticker.previousClose,
        ticker.change,
        ticker.percentage,
        ticker.baseVolume,
        ticker.quoteVolume,
    ];

    try {
        await pool.query(query, values);
    } catch (e) {
        logger.error(`${exchangeId} 거래소 ${baseSymbol}/${quoteSymbol} 심볼의 티커 데이터 저장 실패: `, e);
    }
};

// DB에 캔들 데이터 저장
const saveCandle = async (exchangeId, baseSymbol, quoteSymbol, timeframe, candle) => {
    if (!candle) return;

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
        timeframe,
        candle.open,
        candle.high,
        candle.low,
        candle.close,
        candle.volume
    ];

    try {
        await pool.query(query, values);
    } catch (e) {
        logger.error(`${exchangeId} 거래소 ${baseSymbol}/${quoteSymbol} 심볼의 캔들 데이터 저장 실패: `, e);
    }
};

// DB 캔들 데이터 배치 저장
const saveCandles = async (exchangeId, baseSymbol, quoteSymbol, timeframe, candles) => {
    if (!candles || candles.length === 0) return;

    const queryPrefix = `
    INSERT INTO candles (
      timestamp, exchange, base_symbol, quote_symbol, timeframe,
      open, high, low, close, volume
    ) VALUES 
  `;

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
    } catch (e) {
        logger.error(`${exchangeId} 거래소 ${baseSymbol}/${quoteSymbol} 심볼의 캔들 데이터 배치 저장 실패: `, e);
    }
};

// DB에 체결 내역 데이터 저장
const saveTrade = async (exchangeId, baseSymbol, quoteSymbol, trade) => {
    if (!trade) return;

    const query = `
    INSERT INTO trades (
      timestamp, exchange, base_symbol, quote_symbol, trade_id, price, amount, cost, side
    ) 
    VALUES (to_timestamp($1 / 1000.0), $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (timestamp, exchange, base_symbol, quote_symbol) DO NOTHING
  `;

    const values = [
        trade.timestamp,
        exchangeId,
        baseSymbol,
        quoteSymbol,
        trade.id,
        trade.price,
        trade.amount,
        trade.cost,
        trade.side,
    ];

    try {
        await pool.query(query, values);
    } catch (e) {
        logger.error(`${exchangeId} 거래소 ${baseSymbol}/${quoteSymbol} 심볼의 체결 내역 데이터 저장 실패: `, e);
    }
};

const getLatestSavedCandle = async (exchange, baseSymbol, timeframe) => {
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
    } catch (e) {
        logger.error(`${exchange} 거래소 ${baseSymbol} 심볼의 가장 최근 ${timeframe} 캔들 데이터 조회 실패: `, e);
    }
};

const getOldestSavedCandle = async (exchange, baseSymbol, timeframe) => {
    const query = `SELECT timestamp, exchange, base_symbol, timeframe
                          FROM candles
                          WHERE exchange = $1 AND base_symbol = $2 AND timeframe = $3
                          ORDER BY timestamp
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
    } catch (e) {
        logger.error(`${exchange} 거래소 ${baseSymbol} 심볼의 가장 오래된 ${timeframe} 캔들 데이터 조회 실패: `, e);
    }
};

const getAllCoins = async () => {
    const query = "SELECT symbol, name FROM coins";

    try {
        const { rows } = await pool.query(query);
        return rows;
    } catch (e) {
        logger.error(`코인 목록 조회 실패: `, e);
    }
};

const saveCoins = async (coins) => {
    if (!coins || coins.length === 0) return;

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
    } catch (e) {
        logger.error(`코인 데이터 배치 저장 실패: `, e);
    }
};

const deleteCoins = async (coins) => {
    if (!coins || coins.length === 0) return;

    const symbols = coins.map((coin) => `'${coin.symbol}'`).join(", ");
    const query = `DELETE FROM coins WHERE symbol IN (${symbols});`;

    try {
        await pool.query(query);
    } catch (e) {
        logger.error(`코인 데이터 배치 삭제 실패: `, e);
    }
};

const updateCoins = async (coins) => {
    if (!coins || coins.length === 0) return;

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
    } catch (e) {
        logger.error(`코인 데이터 배치 수정 실패: `, e);
    }
};

const saveSymbols = async (symbols) => {
    if (!symbols || symbols.length === 0) return;

    const query = `
          INSERT INTO symbols (exchange, base_symbol, quote_symbol, use_candle)
          VALUES ${symbols.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(', ')}
          ON CONFLICT (exchange, base_symbol, quote_symbol) DO NOTHING
        `;
    const values = symbols.flat();

    try {
        await pool.query(query, values);
    } catch (e) {
        logger.error(`심볼 데이터 배치 저장 실패: `, e);
    }
};

const getSymbolsForTicker = async (exchangeId, offset, limit) => {

    const query = `
    SELECT base_symbol || '/' || quote_symbol AS symbol
    FROM symbols
    WHERE exchange = $1
    OFFSET $2 LIMIT $3;
  `;

    const value = [
        exchangeId,
        offset,
        limit
    ]

    try {
        const { rows } = await pool.query(query, value);
        return rows.map(row => row.symbol);
    } catch (e) {
        logger.error(`티커 심볼 목록 조회 실패: `, e);

    }
}

const getSymbolsForCandle = async (exchangeId, offset, limit) => {

    const query = `
    SELECT base_symbol || '/' || quote_symbol AS symbol
    FROM symbols
    WHERE exchange = $1 AND use_candle = TRUE
    OFFSET $2 LIMIT $3;
  `;

    const value = [
        exchangeId,
        offset,
        limit
    ]

    try {
        const { rows } = await pool.query(query, value);
        return rows.map(row => row.symbol);
    } catch (e) {
        logger.error(`캔들 심볼 목록 조회 실패: `, e);

    }
}


module.exports = {
    saveTicker,
    saveTrade,
    saveCandle,
    saveCandles,
    getLatestSavedCandle,
    getOldestSavedCandle,
    getAllCoins,
    saveCoins,
    updateCoins,
    deleteCoins,
    saveSymbols,
    getSymbolsForTicker,
    getSymbolsForCandle
};
