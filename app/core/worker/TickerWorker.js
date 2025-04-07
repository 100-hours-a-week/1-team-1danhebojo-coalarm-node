const BaseWorker = require("./BaseWorker");

class TickerWorker extends BaseWorker {
  constructor(exchangeId, symbols, strategy, candle) {
    super(exchangeId, symbols, strategy);

    this.candle = candle;
    this.candleBuffer = {};
  }

  roundToTimeframe(timestamp, timeframe) {
    const date = new Date(timestamp);
    if (timeframe === '1m') return Math.floor(timestamp / 60_000) * 60_000;
    if (timeframe === '1h') return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).getTime();
    if (timeframe === '1d') return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    return timestamp;
  }

  getIntervalMilliseconds() {
    switch (this.candle) {
      case '1m': return 60_000;
      case '1h': return 3_600_000;
      case '1d': return 86_400_000;
      default: return 60_000;
    }
  }

  async run() {
    this.running = true;

    while (this.running) {
      const ticker = await this.strategy.watch(this.exchange, this.symbols);

      await this.strategy.saveTicker(this.exchange, ticker);

      if (!this.candle) {
        continue;
      }

      // 1. 현재 시간을 주어진 candle 단위로 라운딩
      const rounded = this.roundToTimeframe(ticker.timestamp, this.candle); // ex: 09:01:27 → 09:01:00

      // 2. 현재 심볼에 해당하는 버퍼가 없으면 생성
      this.candleBuffer[ticker.symbol] ??= {};

      // 3. 현재 타임프레임(rounded 시간)에 해당하는 캔들 버퍼 초기화
      this.candleBuffer[ticker.symbol][rounded] ??= {
        timestamp: rounded,
        open: ticker.last,
        high: ticker.last,
        low: ticker.last,
        close: ticker.last,
        volume: ticker.baseVolume ?? 0,
      };

      const candle = this.candleBuffer[ticker.symbol][rounded];
      candle.high = Math.max(candle.high, ticker.last);
      candle.low = Math.min(candle.low, ticker.last);
      candle.close = ticker.last;
      candle.volume += ticker.baseVolume ?? 0;

      // 이전 타임프레임 캔들을 저장
      const now = Date.now();
      const prev = this.roundToTimeframe(now - this.getIntervalMilliseconds(), this.candle);
      if (this.candleBuffer[ticker.symbol][prev]) {
        const c = this.candleBuffer[ticker.symbol][prev];

        const data = {
          symbol: ticker.symbol,
          timestamp: c.timestamp,
          timeframe: this.candle,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume
        }

        await this.strategy.saveCandle(this.exchange, data);
        delete this.candleBuffer[ticker.symbol][prev];
      }

    }
  }
}

module.exports = TickerWorker;
