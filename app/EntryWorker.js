require("dotenv").config(); // .env 파일 로드

const WorkerFactory = require("./core/worker/WorkerFactory");
const { parseCliArgs } = require("./utils/args");
const { logger } = require("./utils/logger");

const setupGracefulShutdown = (worker) => {
  const shutdown = () => {
    logger.info(`프로세스 종료 신호 수신. 워커 중지 중...`);
    worker.stop();
    setTimeout(() => {
      logger.info(`프로세스 정상 종료`);
      process.exit(0);
    }, 3000);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

(async () => {
  try {
    // 실행 옵션 입력받기
    const { exchange, type, timeframe, debug, symbol } = parseCliArgs();

    // 워커 생성
    const worker = WorkerFactory.create({
      exchangeId: exchange,
      type: type,
      timeframe: timeframe,
      debug: debug,
      symbol: symbol
    });

    logger.info(`${type} 유형의 워커 생성 (캔들 단위: ${timeframe ?? '지정 안함'}, 거래소: ${exchange ?? '지정 안함'})`);

    setupGracefulShutdown(worker);

    await worker.run();
  } catch (e) {
    logger.error(`프로세스 비정상 종료: `, e);
    process.exit(1);
  }
})();
