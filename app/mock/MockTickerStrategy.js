const { logger } = require("../utils/logger");
class MockTickerStrategy {

  constructor({tps = 100, queueSize = 1000, ttl = 3000}) {
    this.queue = [];
    this.tps = tps;
    this.interval = 1000 / tps;
    this.queueSize = queueSize;
    this.ttl = ttl;

    this._startProducer();
  }

  _startProducer() {
    setInterval(() => {

      if (this.queue.length >= this.queueSize) {
        logger.info(`[MockTickerStrategy] Queue 용량 초과 티커 데이터 생성 스킵...`);
        return;
      }

      const price = Math.random() * (130000000 - 120000000) + 120000000;
      const percentage = (Math.random() - 0.5) * 0.02;
      const volume = Math.random() * (3000 - 500) + 500;

      const ticker = {
        "symbol": "MOCK/MOCK",
        "timestamp": Date.now(),
        "high": price,
        "low": price,
        "open": price,
        "close": price,
        "last": price,
        "previousClose": price,
        "change": price,
        "percentage": percentage,
        "average": price,
        "baseVolume": volume,
        "quoteVolume": volume,
      }

      this.queue.push(ticker);
    }, this.interval);

    logger.info(`[MockTickerStrategy] ${this.interval.toFixed(2)}ms 간격으로 티커 생성 시작 (TPS=${this.tps})`);
  }
  async getSymbols(exchange, offset, limit) {
    logger.info('[MockTickerStrategy] 티커 심볼을 로드했습니다.');
    return [];
  }

  async watch(exchange, symbols) {
    while (this.queue.length === 0) {
      await new Promise((res) => setTimeout(res, 1));
    }

    const ticker = this.queue.shift();

    const age = Date.now() - ticker.timestamp;
    if (age > this.ttl) {
      logger.info(`[MockTickerStrategy] TTL 초과 티커 무시됨 (지연: ${age}ms)`);
      return null;
    }
    
    return ticker;
  }

  async save(exchange, ticker) {
    logger.info('[MockTickerStrategy] 티커 데이터를 저장했습니다.');
  }
}

module.exports = MockTickerStrategy;
