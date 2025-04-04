class BaseWorker {
  constructor(exchangeId, symbols, strategy) {
    const ccxt = require("ccxt");
    const ccxtpro = ccxt.pro;

    this.symbols = symbols;
    this.strategy = strategy;
    this.exchange = new ccxtpro[exchangeId]({
      enableRateLimit: true,
      options: {
        defaultType: "spot",
      },
    });

    this.running = false;
  }
  async run() {
    throw new Error("오버라이딩 하세요.");
  }

  stop() {
    this.running = false;
  }
}

module.exports = BaseWorker;
