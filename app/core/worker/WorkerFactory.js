const { logger } = require("../../utils/logger");
const TickerWorker = require("./TickerWorker");
const TickerStrategy = require("../strategy/TickerStrategy");
const BackFillWorker = require("./BackFillWorker");
const BackFillStrategy = require("../strategy/BackFillStrategy");

// Mock
const MockTickerStrategy = require("../../mock/MockTickerStrategy");
const MockBackFillStrategy = require("../../mock/MockBackFillStrategy");

class WorkerFactory {
  static create(exchangeId, type, symbols, candle) {
    switch (type) {
      case "ticker":
        return new TickerWorker(exchangeId, new TickerStrategy(), symbols, candle);
      case "backfill":
        return new BackFillWorker(exchangeId, new BackFillStrategy(), symbols, candle);
      default:
        throw new Error(`일치하는 워커 타입이 존재하지 않습니다: ${type}`);
    }
  }
}

module.exports = WorkerFactory;
