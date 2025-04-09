const BaseWorker = require("./BaseWorker");
const {logger} = require("../../utils/logger");

class BackFillWorker extends BaseWorker {
  constructor(exchangeId, strategy, symbols, candle) {
    super(exchangeId, strategy);
    this.symbols = symbols;
    this.candle = candle;
    this.interval = this.getIntervalMilliseconds(candle);
    this.limit = 200;
  }

  // DB에 저장된 캔들이 없는 경우 현재 시점 -> 현재 시점부터 코인 상장 시점까지 수집
  // DB에 저장된 캔들이 있는 경우 현재 시점 -> 마지막 캔들 - 1M 부터 코인 상장 시점까지 수집
  async run() {
    const [symbol] = this.symbols;
    const oldestCandle = await this.strategy.getOldestCandle(
        this.exchange,
        symbol,
        this.candle
    );

    const maxEmptyCount = 10; // 연속으로 빈 응답 허용 횟수
    let emptyCount = 0;

    // 기준 시점 설정
    let end = oldestCandle.timestamp ??  Date.now();
    const start = Date.UTC(2017, 1, 1);

    while (true) {
      // 마지막 캔들 시간 계산
      const since = end - this.interval * this.limit;

      if (since < start) {
        logger.info(`${this.exchange.name} 거래소 ${symbol} 심볼의 ${this.candle} 캔들 데이터 수집 완료`);
        break;
      }

      // 캔들 데이터 조회
      const candles = await this.strategy.fetch(
          this.exchange,
          symbol,
          this.candle,
          since,
          this.limit
      );

      if (!candles.length) {
        emptyCount++;
        logger.info(`${this.exchange.name} 거래소 ${symbol} 심볼의 빈 캔들 데이터 응답(${emptyCount}/${maxEmptyCount})`);

        if (emptyCount >= maxEmptyCount) {
          throw new Error(`${this.exchange.name} 거래소 ${symbol} 심볼의 연속된 빈 캔들 데이터 응답으로 인한 실행 종료`);
        }

        end = since - 1;
        continue;
      }

      emptyCount = 0; // 정상 데이터 수신 시 카운팅 초기화

      // 캔들 배치 저장
      await this.strategy.save(
          this.exchange,
          symbol,
          this.candle,
          candles
      );

      const oldest = candles[0][0];

      // 다음 루프를 위한 end 갱신
      end = oldest - 1;
    }
  }
}

module.exports = BackFillWorker;
