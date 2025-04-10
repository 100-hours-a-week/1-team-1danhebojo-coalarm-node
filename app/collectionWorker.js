require("dotenv").config(); // .env 파일 로드
// collectionWorker.js : 데이터 수집 워커 진입점

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
    const { exchange, type, symbols, candle } = parseCliArgs();

    // 워커 생성
    const worker = WorkerFactory.create(exchange, type, symbols, candle);
    logger.info(`${exchange} 거래소 ${type} 유형의 워커 생성 (심볼 개수: ${symbols.length}, 캔들 단위: ${candle ?? '지정 안함'})`);

    setupGracefulShutdown(worker);

    await worker.run();
  } catch (e) {
    logger.error(`프로세스 비정상 종료: `, e);
    process.exit(1);
  }
})();
