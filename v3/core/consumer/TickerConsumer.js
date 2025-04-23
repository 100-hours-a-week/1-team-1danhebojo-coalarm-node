 const { logger } = require('../../utils/logger')
class TickerConsumer {
    constructor({ exchangeId, strategy }) {
        this.exchangeId = exchangeId;
        this.strategy = strategy;
        this.buffer = [];
        this.BATCH_SIZE = process.env.DB_BATCH_SIZE;
    }

    async run() {
        await this.strategy.consume({
            exchangeName: process.env.MQ_EXCHANGE_NAME,
            queueName: process.env.MQ_QUEUE_NAME,
            bindingKey: process.env.MQ_BINDING_KEY,
            prefetch: process.env.MQ_PREFETCH,
            onMessage: async (data, msg, channel) => {
                this.buffer.push(data);

                if (this.buffer.length >= this.BATCH_SIZE) {
                    const tickers = this.buffer.splice(0, this.BATCH_SIZE);
                    try {
                        await this.strategy.save(this.exchangeId, tickers);
                        channel.ack(msg);
                    } catch (e) {
                        logger.error('DB 저장 실패', e);
                        channel.nack(msg, false, true);
                    }
                }
            }
        })
    }
}

module.exports = TickerConsumer;