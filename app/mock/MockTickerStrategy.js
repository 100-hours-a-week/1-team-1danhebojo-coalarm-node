const { logger } = require("../utils/logger");
class MockTickerStrategy {
  async watch(exchange, symbols) {
    try {
      return null
    } catch (e) {
      logger.error(`${exchange.name} 거래소의 티커 데이터를 받아오는 데에 실패했습니다.`, e);
    }
  }

  async saveTicker(exchange, ticker) {
    logger.info('[MockTickerStrategy] 티커 데이터를 저장했습니다.');
  }

  async saveCandle(exchange, timeframe, candle) {
    logger.info('[MockTickerStrategy] 캔들 데이터를 저장했습니다.');
  }
}

module.exports = MockTickerStrategy;
