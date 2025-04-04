const { logger } = require("../../utils/logger");
const { saveTicker } = require("../../utils/db");
class TickerStrategy {
  async watch(exchange, symbols) {
    try {
      return Object.values(await exchange.watchTickers(symbols))[0];
    } catch (err) {
      logger.error(
        `거래소: ${exchange.name}의 티커 데이터를 받아오는 데에 실패했습니다.`,
      );
    }
  }

  async save(exchange, data) {
    const [baseSymbol, quoteSymbol] = data.symbol.split("/");
    await saveTicker(exchange.id, baseSymbol, quoteSymbol, data);
  }
}

module.exports = TickerStrategy;
