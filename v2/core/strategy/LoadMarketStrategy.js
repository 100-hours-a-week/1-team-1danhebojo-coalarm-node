const { saveSymbols } = require("../../utils/query");
class LoadMarketStrategy {

  async saveSymbols(symbols) {
    await saveSymbols(symbols);
  }
}

module.exports = LoadMarketStrategy;
