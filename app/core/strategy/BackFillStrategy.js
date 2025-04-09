const { logger } = require("../../utils/logger");
const { saveCandles, getOldestSavedCandle} = require("../../utils/db");
class BackFillStrategy {

  async fetch(exchange, symbol, timeframe, since, limit) {
    try {
      return await exchange.fetchOHLCV(symbol, timeframe, since, limit);
    } catch (e) {
      logger.error(`${exchange.name} 거래소 ${symbol} 심볼의 ${timeframe} 캔들 데이터를 받아오는 데에 실패했습니다.`, e);
    }
  }


  async getOldestCandle(exchange, symbol, timeframe) {
    const [baseSymbol, _] = symbol.split("/");
    return await getOldestSavedCandle(exchange.id, baseSymbol, timeframe);
  }

  async save(exchange, symbol, timeframe, candles) {
    const [baseSymbol, quoteSymbol] = symbol.split("/");
    await saveCandles(exchange.id, baseSymbol, quoteSymbol, timeframe, candles);
  }
}

module.exports = BackFillStrategy;
