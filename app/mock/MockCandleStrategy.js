const { logger } = require("../utils/logger");
class MockCandleStrategy {
  async getSymbols(exchange) {
    logger.info('[MockCandleStrategy] 캔들 심볼을 로드했습니다.');
  }

  async watch(exchange, symbols) {
    try {
      return null;
    } catch (e) {
      logger.error(`${exchange.name} 거래소의 티커 데이터를 받아오는 데에 실패했습니다.`, e);
    }
  }

  async save(exchange, ticker) {
    logger.info('[MockCandleStrategy] 캔들 데이터를 저장했습니다.');
  }
}

module.exports = MockCandleStrategy;
