const ccxt = require("ccxt");
const { logger } = require("../../utils/logger");
const { saveSymbols } = require("../../utils/db");

const setupGracefulShutdown = () => {
  const shutdown = () => {
    logger.info(`프로세스 종료 신호 수신. 워커 중지 중...`);

    setTimeout(() => {
      logger.info(`프로세스 정상 종료`);
      process.exit(0);
    }, 3000);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

const run = async () => {
  const exchanges = ccxt.exchanges;

  try {
    for (const exchangeId of exchanges) {
      const exchange = new ccxt[exchangeId]({
        enableRateLimit: true,
        options: {
          defaultType: "spot",
        },
      });

      try {
        await exchange.loadMarkets();
      } catch (e) {
        logger.info(`${exchangeId} 거래소는 loadMarkets를 지원하지 않습니다.`);
        continue;
      }

      const markets = exchange.markets;

      const symbols = Object.values(markets)
          .filter((market) => market.spot && (market.quote === 'KRW' || market.quote === 'USDT'))
          .map((market) => [
              exchangeId,
              market.base,
              market.quote,
              false
          ])

      await saveSymbols(symbols);
    }
  } catch (e) {
    console.error(`에러 발생`);
  }
}

(async () => {
  try {
    logger.info(`심볼 목록 워커 생성`);
    setupGracefulShutdown();
    await run();
  } catch (e) {
    logger.error(`프로세스 비정상 종료: `, e);
    process.exit(1);
  }
})();