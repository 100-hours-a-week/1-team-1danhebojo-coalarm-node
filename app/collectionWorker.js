// collectionWorker.js : 데이터 수집 워커 진입점

const WorkerFactory = require("./core/worker/WorkerFactory");
const { parseCliArgs } = require("./utils/args");
const { logger } = require("./utils/logger");

const setupGracefulShutdown = (worker) => {
  const shutdown = () => {
    logger.info(`[시스템] 종료 신호 수신. 워커 중지 중...`);
    worker.stop();
    setTimeout(() => {
      logger.info(`[시스템] 정상 종료`);
      process.exit(0);
    }, 3000);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

(async () => {
  try {
    const { exchange, type, symbols, candle } = parseCliArgs();

    const worker = WorkerFactory.create(exchange, type, symbols, candle);
    logger.info(
      `[데이터 수집 워커] 거래소: ${exchange} 데이터: ${type} 수집할 심볼의 개수: ${symbols.length}`,
    );

    setupGracefulShutdown(worker);

    await worker.run();
  } catch (e) {
    logger.error(`[데이터 수집 워커] 에러 발생: ${e.message}`);
    process.exit(1);
  }
})();
