const BaseWorker = require("./BaseWorker");

class TickerWorker extends BaseWorker {
  constructor(exchangeId, symbols, strategy) {
    super(exchangeId, symbols, strategy);
  }
  async run() {
    this.running = true;

    while (this.running) {
      const data = await this.strategy.watch(this.exchange, this.symbols);
      await this.strategy.save(this.exchange, data);
    }
  }
}

module.exports = TickerWorker;
