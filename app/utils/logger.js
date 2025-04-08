const { format, createLogger, transports} = require("winston");

const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(({ timestamp, level, message }) => {
    const procName = process.env.name || `pid-${process.pid}`;
    const msg = typeof message === 'object' ? JSON.stringify(message) : message;
    return `[${timestamp}] [${procName}] [${level.toUpperCase()}] ${msg}`;
  }),
);

const logger = createLogger({
  level: "info",
  transports: [
    new transports.Console({ format: logFormat }),
    new transports.File({ filename: "combine.log", format: logFormat }),
    new transports.File({ filename: "error.log", level: "error", format: logFormat }),
  ],
});

const formatMessage = (message, data = {}) => {
  return Object.keys(data).reduce(
    (msg, key) => msg.replace(`{${key}}`, data[key]),
    message,
  );
};

module.exports = { logger, formatMessage };
