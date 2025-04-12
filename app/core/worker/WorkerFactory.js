// Worker
const TickerWorker = require("./TickerWorker");
const BackFillWorker = require("./BackFillWorker");
const CandleWorker = require("./CandleWorker");
const LoadMarketWorker = require("./LoadMarketWorker");

// Strategy
const TickerStrategy = require("../strategy/TickerStrategy");
const BackFillStrategy = require("../strategy/BackFillStrategy");
const CandleStrategy = require("../strategy/CandleStrategy");
const LoadMarketStrategy = require("../strategy/LoadMarketStrategy");

// Mock
const MockTickerStrategy = require("../../mock/MockTickerStrategy");
const MockBackFillStrategy = require("../../mock/MockBackFillStrategy");
const MockCandleStrategy = require("../../mock/MockCandleStrategy");

class WorkerFactory {
  static create({
      exchangeId,
      type,
      timeframe,
      debug = false,
      symbol,
      offset,
      limit,
  }) {
    switch (type) {
      case "ticker":
        return new TickerWorker({
              exchangeId: exchangeId,
              strategy: debug ? new MockTickerStrategy() : new TickerStrategy(),
              offset: offset,
              limit: limit
        });
      case "backfill":
        return new BackFillWorker({
            exchangeId: exchangeId,
            strategy: debug ? new MockBackFillStrategy() : new BackFillStrategy(),
            timeframe: timeframe,
            symbol: symbol
        });
      case "candle":
        return new CandleWorker({
            exchangeId: exchangeId,
            strategy: debug ? new MockCandleStrategy() : new CandleStrategy(),
            timeframe: timeframe,
            offset: offset,
            limit: limit
        })
      case "load_market":
        return new LoadMarketWorker(new LoadMarketStrategy());
      default:
        throw new Error(`일치하는 워커 타입이 존재하지 않습니다: ${type}`);
    }
  }
}

module.exports = WorkerFactory;
