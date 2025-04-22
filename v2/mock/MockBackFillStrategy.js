const { logger } = require("../utils/logger");
class MockBackFillStrategy {

  async fetch(exchange, symbol, timeframe, since, limit) {
    try {
      return [];
    } catch (e) {
      logger.error(`${exchange.name} 거래소 ${symbol} 심볼의 ${timeframe} 캔들 데이터를 받아오는 데에 실패했습니다.`, e);
    }
  }


  async getOldestCandle(exchange, symbol, timeframe) {
    logger.info('[MockBackFillStrategy] 가장 오래된 캔들 데이터를 저장했습니다.');
  }

  async save(exchange, symbol, timeframe, candles) {
    logger.info('[MockBackFillStrategy] 캔들 데이터를 저장했습니다.');
  }
}

module.exports = MockBackFillStrategy;
