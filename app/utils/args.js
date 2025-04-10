const minimist = require("minimist");

const VALID_CANDLE_TYPES = ["1m", "1h", "1d"];

const parseCliArgs = () => {
  const args = minimist(process.argv.slice(2));

  if (!args.type) {
    throw new Error(
        "필수 인자 누락: --type 옵션이 필요합니다.",
    );
  }

  const exchange = args.exchange.toLowerCase();
  const type = args.type.toLowerCase();
  const debug = args.debug;
  const symbol = args.symbol;

  let candle;
  if (args.candle) {
    if (!VALID_CANDLE_TYPES.includes(args.candle)) {
      throw new Error(`--candle 값은 다음 중 하나여야 합니다: ${VALID_CANDLE_TYPES.join(", ")}`);
    }
    candle = args.candle;
  }

  return { exchange, type, candle, debug, symbol };
};

module.exports = { parseCliArgs };