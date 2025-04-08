const BaseWorker = require("./BaseWorker");

class BackFillWorker extends BaseWorker {
  constructor(exchangeId, strategy, symbols, candle) {
    super(exchangeId, strategy);
    this.symbols = symbols;
    this.candle = candle;
  }

  async run() {
    const [symbol] = this.symbols;
    const oldestCandle = await this.strategy.getOldestCandle(this.exchange, symbol, this.candle);

    // DB에 저장된 캔들이 없는 경우 현재 시점 -> 현재 시점부터 코인 상장 시점까지 수집
    // DB에 저장된 캔들이 있는 경우 현재 시점 -> 마지막 캔들 - 1M 부터 코인 상장 시점까지 수집
    await this.strategy.backfill(
        this.exchange,
        symbol,
        oldestCandle?.timestamp,
        this.candle,
        this.getIntervalMilliseconds(this.candle)
    );

  }
}

module.exports = BackFillWorker;
