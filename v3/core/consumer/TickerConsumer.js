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
            prefetch: parseInt(process.env.MQ_PREFETCH || "50", 10),
            onMessage: async (msg, channel) => {

                this.buffer.push(msg);

                if (this.buffer.length >= this.BATCH_SIZE) {
                    const batch = this.buffer.splice(0, this.BATCH_SIZE);
                    const tickers = batch.map(msg => JSON.parse(msg.content.toString()));
                    try {
                        await this.strategy.save(this.exchangeId, tickers);
                        const last = batch[batch.length - 1];
                        channel.ack(last, true);
                    } catch (e) {
                        logger.error('DB 저장 실패', e);
                        batch.forEach(msg => channel.nack(msg, false, true));
                    }
                }
            }
        })
    }
}

module.exports = TickerConsumer;