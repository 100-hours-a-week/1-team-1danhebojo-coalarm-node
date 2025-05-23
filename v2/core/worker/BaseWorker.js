const {logger} = require("../../utils/logger");
const axios = require("axios");

class BaseWorker {
  constructor(exchangeId, strategy) {
    const ccxt = require("ccxt");
    const ccxtpro = ccxt.pro;

    this.strategy = strategy;
    this.exchange = new ccxtpro[exchangeId]({
      enableRateLimit: true,
      options: {
        defaultType: "spot",
      },
    });

    this.running = false;
  }
  async run() {
    throw new Error("하위 클래스를 생성하고 run() 메서드를 오버라이딩");
  }

  stop() {
    this.running = false;
  }

  // 주어진 timestamp를 지정된 timeframe 단위로의 시작 시점으로 맞춰주는 함수
  roundToTimeframe(timestamp, timeframe) {
    const date = new Date(timestamp);
    if (timeframe === '1m') return Math.floor(timestamp / 60_000) * 60_000;
    if (timeframe === '1h') return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).getTime();
    if (timeframe === '1d') return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    return timestamp;
  }

  // 주어진 timeframe 문자열을 milliseconds 단위로 변환하는 함수
  getIntervalMilliseconds(timeframe) {
    switch (timeframe) {
      case '1m': return 60_000;
      case '1h': return 3_600_000;
      case '1d': return 86_400_000;
      default: return 60_000;
    }
  }

  async reportToMonitor(metric) {
    try {
      await axios.post(process.env.MONITORING_URL, metric)
    } catch (e) {
      logger.error(`메트릭 전송 실패`, e);
    }
  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = BaseWorker;
