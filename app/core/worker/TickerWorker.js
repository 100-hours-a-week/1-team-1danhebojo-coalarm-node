const BaseWorker = require("./BaseWorker");
const {logger} = require("../../utils/logger");

class TickerWorker extends BaseWorker {
  constructor({exchangeId, strategy, offset, limit}) {
    super(exchangeId, strategy);
    this.offset = offset;
    this.limit = limit;
    this.metrics = {
      tps: 0,
      error: 0,
      latencySum: 0,
      latencyCount: 0,
    };
  }

  async run() {
    this.running = true;

    const maxEmptyCount = 10; // 연속으로 빈 응답 허용 횟수
    let emptyCount = 0;

    const symbols = await this.strategy.getSymbols(this.exchange, this.offset, this.limit);

    // Prometheus Metric 수집
    this.metricsInterval = setInterval(async () => {
      const { tps, error, latencySum, latencyCount } = this.metrics;

      await this.reportToMonitor({
        workerId: `${process.env.name}`,
        tps,
        error,
        latency: latencyCount > 0 ? latencySum / latencyCount : 0,
      });

      this.metrics = {
        tps: 0,
        error: 0,
        latencySum: 0,
        latencyCount: 0,
      };
    }, 5000);

    while (this.running) {
      const start = Date.now();
      const ticker = await this.strategy.watch(this.exchange, symbols);

      if (!ticker) {
        emptyCount++;
        this.metrics.error += 1;
        logger.info(`${this.exchange.name} 거래소 티커 데이터 빈 응답(${emptyCount}/${maxEmptyCount})`);

        if (emptyCount >= maxEmptyCount) {
          throw new Error(`${this.exchange.name} 거래소 티커 데이터의 연속된 빈 응답으로 인한 실행 종료`);
        }

        continue;
      }

      emptyCount = 0;
      // 실시간 티커 데이터 저장
      await this.strategy.save(this.exchange, ticker);
      const latency = Date.now() - start;

      this.metrics.tps += 1;
      this.metrics.latencySum += latency;
      this.metrics.latencyCount += 1;
    }

    clearInterval(this.metricsInterval);
  }
}

module.exports = TickerWorker;
