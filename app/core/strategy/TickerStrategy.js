const { logger } = require("../../utils/logger");
const { saveTicker, getSymbolsForTicker} = require("../../utils/query");
class TickerStrategy {
  async getSymbols(exchange, offset, limit) {
    return await getSymbolsForTicker(exchange.id, offset, limit);
  }

  async watch(exchange, symbols) {
    try {
      const tickers = Object.values(await exchange.watchTickers(symbols))
      return tickers[0];
    } catch (e) {
      logger.error(`${exchange.name} 거래소의 티커 데이터를 받아오는 데에 실패했습니다.`, e);
      return null;
    }
  }

  async save(exchange, ticker) {
    const [baseSymbol, quoteSymbol] = ticker.symbol.split("/");
    await saveTicker(exchange.id, baseSymbol, quoteSymbol, ticker);
  }
}

module.exports = TickerStrategy;
