const { logger } = require("../../utils/logger");
const { saveTicker, getSymbolsForTicker} = require("../../utils/db");
class TickerStrategy {
  async getSymbols(exchange) {
    return await getSymbolsForTicker(exchange.id);
  }

  async watch(exchange, symbols) {
    try {
      return Object.values(await exchange.watchTickers(symbols))[0];
    } catch (e) {
      logger.error(`${exchange.name} 거래소의 티커 데이터를 받아오는 데에 실패했습니다.`, e);
    }
  }

  async save(exchange, ticker) {
    const [baseSymbol, quoteSymbol] = ticker.symbol.split("/");
    await saveTicker(exchange.id, baseSymbol, quoteSymbol, ticker);
  }
}

module.exports = TickerStrategy;
