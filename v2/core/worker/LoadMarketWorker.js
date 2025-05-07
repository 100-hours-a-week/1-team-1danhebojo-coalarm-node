const ccxt = require("ccxt");
const { logger } = require("../../utils/logger");

class LoadMarketWorker {
  constructor(strategy) {
    this.strategy = strategy;
  }

  async run() {
    const exchanges = ccxt.exchanges;

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
        logger.info(`${exchangeId} 거래소는 마켓 로딩을 지원하지 않습니다.`);
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

      await this.strategy.saveSymbols(symbols);
    }
  }
}

module.exports = LoadMarketWorker;
