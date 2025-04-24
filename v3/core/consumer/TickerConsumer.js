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

                    let tickers;
                    try {
                        tickers = batch.map(msg => JSON.parse(msg.content.toString()));
                    } catch (e) {
                        logger.error('[TickerConsumer] 메시지 파싱 실패로 인해 DLQ로 메시지를 이동합니다.', e);
                        batch.forEach((m) => channel.nack(m, false, false));
                        return;
                    }

                    try {
                        await this.strategy.save({
                            exchangeId: this.exchangeId,
                            tickers
                        });
                        const last = batch[batch.length - 1];
                        channel.ack(last, true);
                    } catch (e) {
                        const isRecoverable = this._isRecoverableError(e);
                        logger.error(`[TickerConsumer] DB 저장 실패로 인해 ${isRecoverable ? '재시도합니다.' : 'DLQ로 메시지를 이동합니다.'}`, e);
                        batch.forEach((m) => channel.nack(m, false, isRecoverable));
                    }
                }
            }
        })
    }

    _isRecoverableError(error) {
        const recoverableErrors = ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND'];
        return recoverableErrors.includes(error.code);
    }
}

module.exports = TickerConsumer;