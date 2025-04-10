const { logger } = require("../../utils/logger");
const { saveCandle, getSymbolsForCandle} = require("../../utils/db");
class CandleStrategy {

  async getSymbols(exchange, offset, limit) {
    return await getSymbolsForCandle(exchange.id, offset, limit);
  }

  async watch(exchange, symbols) {
    try {
      return Object.values(await exchange.watchTickers(symbols))[0];
    } catch (e) {
      logger.error(`${exchange.name} 거래소의 티커 데이터를 받아오는 데에 실패했습니다.`, e);
    }
  }

  async save(exchange, timeframe, candle) {
    const [baseSymbol, quoteSymbol] = candle.symbol.split("/");
    await saveCandle(exchange.id, baseSymbol, quoteSymbol, timeframe, candle);
  }
}

module.exports = CandleStrategy;
