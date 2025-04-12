const { saveSymbols } = require("../../utils/query");
class TickerStrategy {

  async saveSymbols(symbols) {
    await saveSymbols(symbols);
  }
}

module.exports = TickerStrategy;
