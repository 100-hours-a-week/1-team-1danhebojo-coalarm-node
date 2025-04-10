const minimist = require("minimist");

const VALID_CANDLE_TYPES = ["1m", "1h", "1d"];

const parseCliArgs = () => {
  const args = minimist(process.argv.slice(2));

  if (!args.type) {
    throw new Error(
        "필수 인자 누락: --type 옵션이 필요합니다.",
    );
  }
  const type = args.type.toLowerCase();
  const exchange = args.exchange?.toLowerCase();
  const debug = args.debug?.toLowerCase();
  const symbol = args.symbol?.toLowerCase();

  const offset = args.offset;
  const limit = args.limit;

  let timeframe;
  if (args.timeframe) {
    if (!VALID_CANDLE_TYPES.includes(args.timeframe)) {
      throw new Error(`--candle 값은 다음 중 하나여야 합니다: ${VALID_CANDLE_TYPES.join(", ")}`);
    }
    timeframe = args.timeframe;
  }

  return { exchange, type, timeframe, debug, symbol, offset, limit };
};

module.exports = { parseCliArgs };