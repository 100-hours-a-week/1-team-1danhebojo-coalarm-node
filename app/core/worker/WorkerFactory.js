const { logger } = require("../../utils/logger");
const TickerWorker = require("./TickerWorker");
const TickerStrategy = require("../strategy/TickerStrategy");

class WorkerFactory {
  static create(exchangeId, type, symbols) {
    switch (type) {
      case "ticker":
        return new TickerWorker(exchangeId, symbols, new TickerStrategy());
      default:
        logger.error(`일치하는 워커 타입이 존재하지 않습니다: ${type}`);
        throw new Error(`일치하는 워커 타입이 존재하지 않습니다.`);
    }
  }
}

module.exports = WorkerFactory;
