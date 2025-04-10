// Worker
const TickerWorker = require("./TickerWorker");
const BackFillWorker = require("./BackFillWorker");
const LoadMarketWorker = require("./LoadMarketWorker");

// Strategy
const TickerStrategy = require("../strategy/TickerStrategy");
const BackFillStrategy = require("../strategy/BackFillStrategy");
const LoadMarketStrategy = require("../strategy/LoadMarketStrategy");

// Mock
const MockTickerStrategy = require("../../mock/MockTickerStrategy");
const MockBackFillStrategy = require("../../mock/MockBackFillStrategy");

class WorkerFactory {
  static create({
                  exchangeId,
                  type,
                  timeframe,
                  debug=false,
                  symbol
  }) {
    switch (type) {
      case "ticker":
        return new TickerWorker({
              exchangeId: exchangeId,
              strategy: debug ? new MockTickerStrategy() : new TickerStrategy(),
        });
      case "backfill":
        return new BackFillWorker({
            exchangeId: exchangeId,
            strategy: debug ? new MockBackFillStrategy() : new BackFillStrategy(),
            timeframe: timeframe,
            symbol: symbol
        });
      case "load_market":
        return new LoadMarketWorker(new LoadMarketStrategy());
      default:
        throw new Error(`일치하는 워커 타입이 존재하지 않습니다: ${type}`);
    }
  }
}

module.exports = WorkerFactory;
