const minimist = require("minimist");
const fs = require("fs");
const path = require("path");

const parseCliArgs = () => {
  const args = minimist(process.argv.slice(2));

  if (!args.exchange || !args.type || !args.symbolPath) {
    throw new Error(
      "필수 인자 누락: --exchange, --type, --symbolPath 모두 필요합니다.",
    );
  }

  const exchange = args.exchange.toLowerCase();
  const type = args.type.toLowerCase();
  const symbolPath = path.resolve(args.symbolPath);

  if (!fs.existsSync(symbolPath)) {
    throw new Error(`심볼 파일이 존재하지 않습니다: ${symbolPath}`);
  }

  let symbols;
  try {
    const raw = fs.readFileSync(symbolPath, "utf8");
    symbols = JSON.parse(raw);
  } catch (err) {
    throw new Error(`심볼 파일 파싱 실패: ${err.message}`);
  }

  if (!Array.isArray(symbols)) {
    throw new Error("심볼 파일은 배열 형식이어야 합니다.");
  }

  symbols = symbols.map((s) => s.trim());

  return { exchange, type, symbols };
};

module.exports = { parseCliArgs };
