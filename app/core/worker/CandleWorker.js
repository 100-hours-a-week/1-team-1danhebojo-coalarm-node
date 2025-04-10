const BaseWorker = require("./BaseWorker");
const {logger} = require("../../utils/logger");

class CandleWorker extends BaseWorker {
  constructor(exchangeId, strategy, timeframe) {
    super(exchangeId, strategy);

    this.timeframe = timeframe;
    this.interval = this.getIntervalMilliseconds(this.timeframe);
    this.candleBuffer = {};
  }

  async run() {
    this.running = true;

    const maxEmptyCount = 10; // 연속으로 빈 응답 허용 횟수
    let emptyCount = 0;

    const symbols = await this.strategy.getSymbols(this.exchange);

    while (this.running) {
      const ticker = await this.strategy.watch(this.exchange, symbols);

      if (!ticker) {
        emptyCount++;
        logger.info(`${this.exchange.name} 거래소 티커 데이터 빈 응답(${emptyCount}/${maxEmptyCount})`);

        if (emptyCount >= maxEmptyCount) {
          throw new Error(`${this.exchange.name} 거래소 티커 데이터의 연속된 빈 응답으로 인한 실행 종료`);
        }
        continue;
      }

      emptyCount = 0;

      // 현재 시간을 주어진 candle 단위로 라운딩
      // ex: 09:01:27 → 09:01:00
      const rounded = this.roundToTimeframe(ticker.timestamp, this.timeframe);

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
      const prev = this.roundToTimeframe(now - this.interval, this.timeframe);
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

        await this.strategy.save(this.exchange, this.timeframe, candle);
        delete this.candleBuffer[ticker.symbol][prev];
      }

    }
  }
}

module.exports = CandleWorker;
