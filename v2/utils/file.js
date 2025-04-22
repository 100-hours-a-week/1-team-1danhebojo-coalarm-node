const fs = require("fs");
const path = require("path");
const { logger } = require("./logger");

const SYMBOL_FILE_PATH = path.resolve(__dirname, "./shared/valid-symbols.json");

const writeValidSymbols = (symbols) => {
  if (!symbols || symbols.length === 0) return;

  try {
    fs.writeFileSync(
      SYMBOL_FILE_PATH,
      JSON.stringify(symbols, null, 2),
      "utf-8",
    );
    logger.info(`공통 심볼 파일 저장 완료 (${symbols.length} 종목)`);
  } catch (e) {
    logger.error("공통 심볼 파일 저장 실패:", e);
  }
};

const writeExchangeSymbols = (exchange, data, quote) => {
  try {
    const PATH = path.resolve(__dirname, `../symbols/${exchange}-symbols.json`);

    const symbols = data
        .filter(({ symbol }) => !(quote === 'USDT' && symbol === 'USDT'))
        .map(({ symbol }) => `${symbol}/${quote}`);

    fs.writeFileSync(PATH, JSON.stringify(symbols, null, 2), "utf-8");
    logger.info(`${exchange} 거래소의 심볼 파일 저장 완료 (${symbols.length} 종목)`);

  } catch (e) {
    logger.error(`${exchange} 거래소의 심볼 파일 저장 실패: `, e);
  }
};

const readValidSymbols = (quote) => {
  try {
    const data = fs.readFileSync(SYMBOL_FILE_PATH, "utf-8");
    const symbols = JSON.parse(data);

    logger.info(`심볼 파일 읽기 성공`);

    return symbols
      .filter((s) => !(quote === "USDT" && s.symbol === "USDT"))
      .map((s) => `${s.symbol}/${quote}`);
  } catch (e) {
    logger.error("심볼 파일 읽기 실패:", e);
    return [];
  }
};

module.exports = { readValidSymbols, writeValidSymbols, writeExchangeSymbols };
