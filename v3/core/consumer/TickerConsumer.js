const { logger } = require('../../utils/logger');
const BaseConsumer = require('./BaseConsumer')

class TickerConsumer extends BaseConsumer {
    constructor({ exchangeId, strategy }) {
        super();
        this.exchangeId = exchangeId;
        this.strategy = strategy;
        this.buffer = [];
        this.BATCH_SIZE = parseInt(process.env.DB_BATCH_SIZE || "50", 10);
        this.metrics = {
            totalConsumed: 0,
            sendToDLQTotal: 0,
            recoverableRetryTotal: 0,
            batchLatencySum: 0,
            batchCount: 0
        };
    }

    async run() {
        this._startMetricsReporting();

        await this.strategy.consume({
            exchangeName: process.env.MQ_EXCHANGE_NAME,
            queueName: process.env.MQ_QUEUE_NAME,
            bindingKey: `ticker.${this.exchangeId}.*`,
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
                        this.metrics.sendToDLQTotal += batch.length;
                        return;
                    }

                    const start = Date.now();

                    try {
                        await this.strategy.save({
                            exchangeId: this.exchangeId,
                            tickers
                        });

                        const latency = Date.now() - start;
                        this.metrics.batchLatencySum += latency;
                        this.metrics.batchCount += 1;
                        this.metrics.totalConsumed += tickers.length;

                        const last = batch[batch.length - 1];
                        channel.ack(last, true);
                    } catch (e) {
                        const isRecoverable = this._isRecoverableError(e);
                        logger.error(`[TickerConsumer] DB 저장 실패로 인해 ${isRecoverable ? '재시도합니다.' : 'DLQ로 메시지를 이동합니다.'}`, e);

                        batch.forEach((m) => channel.nack(m, false, isRecoverable));

                        if (isRecoverable) {
                            this.metrics.recoverableRetryTotal += batch.length;
                        } else {
                            this.metrics.sendToDLQTotal += batch.length;
                        }
                    }
                }
            }
        });
    }

    _startMetricsReporting() {
        this.metricsInterval = setInterval(async () => {
            try {
                await this._reportMetrics();
            } catch (e) {
                logger.error('[TickerConsumer] 메트릭 전송 실패', e);
            } finally {
                this._clearMetrics();
            }
        }, 1000);
    }

    async _reportMetrics() {
        const {
            totalConsumed,
            sendToDLQTotal,
            recoverableRetryTotal,
            batchLatencySum,
            batchCount
        } = this.metrics;

        const avgBatchLatency = batchCount > 0 ? batchLatencySum / batchCount : 0;

        await this.reportToMonitor({
            consumerId: process.env.CONSUMER_ID ?? `${process.pid}`,
            consumerTotalConsumed: totalConsumed,
            consumerSendToDLQTotal: sendToDLQTotal,
            consumerRecoverableRetryTotal: recoverableRetryTotal,
            consumerAvgBatchLatency: avgBatchLatency
        });
    }

    _clearMetrics() {
        for (const key of Object.keys(this.metrics)) {
            this.metrics[key] = 0;
        }
    }

    _isRecoverableError(error) {
        const recoverableErrors = ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND'];
        return recoverableErrors.includes(error.code);
    }
}

module.exports = TickerConsumer;
