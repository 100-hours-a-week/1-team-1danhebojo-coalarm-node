const BaseWorker = require("./BaseWorker");

class TickerWorker extends BaseWorker {
  constructor(exchangeId, strategy, symbols, candle) {
    super(exchangeId, strategy);

    this.symbols = symbols;
    this.candle = candle;
    this.candleBuffer = {};
  }

  async run() {
    this.running = true;

    while (this.running) {
      const ticker = await this.strategy.watch(this.exchange, this.symbols);

      // 실시간 티커 데이터 저장
      await this.strategy.saveTicker(this.exchange, ticker);

      if (!this.candle) {
        continue;
      }

      // 현재 시간을 주어진 candle 단위로 라운딩
      // ex: 09:01:27 → 09:01:00
      const rounded = this.roundToTimeframe(ticker.timestamp, this.candle);

      // 현재 심볼에 해당하는 버퍼가 없으면 생성
      this.candleBuffer[ticker.symbol] ??= {};

      // 현재 타임프레임(rounded 시간)에 해당하는 캔들 버퍼 초기화
      this.candleBuffer[ticker.symbol][rounded] ??= {
        timestamp: rounded,
        open: ticker.last,
        high: ticker.last,
        low: ticker.last,
        close: ticker.last,
        volume: ticker.baseVolume ?? 0,
      };

      const curCandle = this.candleBuffer[ticker.symbol][rounded];
      curCandle.high = Math.max(curCandle.high, ticker.last);
      curCandle.low = Math.min(curCandle.low, ticker.last);
      curCandle.close = ticker.last;
      curCandle.volume += ticker.baseVolume ?? 0;

      // 이전 타임프레임 캔들을 저장
      const now = Date.now();
      const prev = this.roundToTimeframe(now - this.getIntervalMilliseconds(this.candle), this.candle);
      if (this.candleBuffer[ticker.symbol][prev]) {
        const prevCandle = this.candleBuffer[ticker.symbol][prev];

        const candle = {
          symbol: ticker.symbol,
          timestamp: prevCandle.timestamp,
          open: prevCandle.open,
          high: prevCandle.high,
          low: prevCandle.low,
          close: prevCandle.close,
          volume: prevCandle.volume
        }

        await this.strategy.saveCandle(this.exchange, this.candle, candle);
        delete this.candleBuffer[ticker.symbol][prev];
      }

    }
  }
}

module.exports = TickerWorker;
