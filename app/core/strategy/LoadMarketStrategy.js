const { saveSymbols } = require("../../utils/db");
class TickerStrategy {

  async saveSymbols(symbols) {
    await saveSymbols(symbols);
  }
}

module.exports = TickerStrategy;
