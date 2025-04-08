const { logger } = require("../../utils/logger");
const { saveCandles, getOldestSavedCandle} = require("../../utils/db");
class BackFillStrategy {

  // 현재 시점부터 코인 상장 시점 까지의 캔들 데이터 저장
  async backfill(exchange, symbol, to, timeframe, interval) {
    const maxLimit = 200; // upbit 최대 개수
    const maxEmptyCount = 10; // 연속으로 빈 응답 허용 횟수
    let emptyCount = 0;

    // 기준 시점 설정
    let end = to ? to : Date.now();
    const start = Date.UTC(2017, 1, 1);

    while (true) {
      // 마지막 캔들 시간 계산
      const since = end - interval * maxLimit;

      if (since < start) {
        logger.info(`${exchange.name} 거래소 ${symbol} 심볼의 ${timeframe} 캔들 데이터 수집 완료`);
        break;
      }

      // 캔들 데이터 조회
      const candles = await exchange.fetchOHLCV(symbol, '1m', since, maxLimit);

      if (!candles.length) {
        emptyCount++;
        logger.info(`${exchange.name} 거래소 ${symbol} 심볼의 빈 응답(${emptyCount}/${maxEmptyCount})`);

        if (emptyCount >= maxEmptyCount) {
          logger.info(`${exchange.name} 거래소 ${symbol} 심볼의 연속된 빈 응답으로 인한 실행 종료`);
          break;
        }

        end = since - 1;
        continue;
      }

      emptyCount = 0; // 정상 데이터 수신 시 카운팅 초기화

      // 캔들 배치 저장
      await this.save(exchange, symbol, timeframe, candles);

      const oldest = candles[0][0];

      // 다음 루프를 위한 end 갱신
      end = oldest - 1;
    }
  }

  async getOldestCandle(exchange, symbol, timeframe) {
    const [baseSymbol, _] = symbol.split("/");
    return await getOldestSavedCandle(exchange.id, baseSymbol, timeframe);
  }

  async save(exchange, symbol, timeframe, candles) {
    const [baseSymbol, quoteSymbol] = symbol.split("/");
    await saveCandles(exchange.id, baseSymbol, quoteSymbol, timeframe, candles);
  }
}

module.exports = BackFillStrategy;
