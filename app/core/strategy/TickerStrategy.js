const { logger } = require("../../utils/logger");
const { saveTicker, saveCandle } = require("../../utils/db");
class TickerStrategy {
  async watch(exchange, symbols) {
    try {
      return Object.values(await exchange.watchTickers(symbols))[0];
    } catch (e) {
      logger.error(`${exchange.name} 거래소의 티커 데이터를 받아오는 데에 실패했습니다.`, e);
    }
  }

  async saveTicker(exchange, ticker) {
    const [baseSymbol, quoteSymbol] = ticker.symbol.split("/");
    await saveTicker(exchange.id, baseSymbol, quoteSymbol, ticker);
  }

  async saveCandle(exchange, timeframe, candle) {
    const [baseSymbol, quoteSymbol] = candle.symbol.split("/");
    await saveCandle(exchange.id, baseSymbol, quoteSymbol, timeframe, candle);
  }
}

module.exports = TickerStrategy;
