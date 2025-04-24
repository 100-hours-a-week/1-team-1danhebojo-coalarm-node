const {logger} = require("../../utils/logger");

class TickerProducer {
    constructor({ exchangeId, chunkSize, strategy }) {
        this.exchangeId = exchangeId;
        this.chunkSize = chunkSize;
        this.strategy = strategy;
        this.retryBuffers = new Map();
    }

    async run() {
        const symbols = await this.strategy.getSymbols(this.exchangeId);
        const chunks = [];

        for (let i = 0; i < symbols.length; i += this.chunkSize) {
            chunks.push(symbols.slice(i, i + this.chunkSize));
        }

        await Promise.allSettled(chunks.map(async (chunk, idx) => {
            const exchange = await this.strategy.createExchangeInstance(this.exchangeId);
            this.retryBuffers.set(idx, []);
            this.startWatching(idx, exchange, chunk);
        }));

        this._startFlushRetryLoop();
    }

    async startWatching(idx, exchange, symbols) {
        logger.info(`[TickerProducer] ${idx} 번째 Producer 연결 시작`);

        while (true) {
            let ticker;
            try {
                ticker = await this.strategy.watch({exchange, symbols});
            } catch (e) {
                logger.error(`[TickerProducer] ${this.exchangeId}의 ${idx} 번째 Producer에서 watch 에러 발생: ${e.message}`);
                continue;
            }

            try {
                await this.strategy.publish({
                    exchangeName: process.env.MQ_EXCHANGE_NAME,
                    routingKey: `ticker.${exchange.id}.${ticker.symbol}`,
                    message: ticker,
                    onComplete: (e, ok) => {
                        if (e) {
                            logger.warn(`[TickerProducer] ${this.exchangeId} ${idx} 번째 Producer에서 publish 실패: ${e.message}`);
                            this._enqueueRetryBuffer(idx, exchange, ticker);
                        }
                    }
                })
            } catch (e) {
                logger.error(`[TickerProducer] ${this.exchangeId} ${idx} 번째 Producer에서 publish 에러 발생: ${e.message}`);
                this._enqueueRetryBuffer(idx, exchange, ticker);
            }
        }
    }

    async flushAllRetryBuffers() {
        for (const [idx, buffer] of this.retryBuffers.entries()) {
            if (!buffer.length) continue;

            const remaining = [];
            for (const item of buffer) {
                await this.strategy.publish({
                    ...item,
                    onComplete: (e, ok) => {
                        if (e) {
                            remaining.push(item);
                        }
                    }
                });
            }
            this.retryBuffers.set(idx, remaining);
        }
    }
    _enqueueRetryBuffer(idx, exchange, ticker) {
        if (!this.retryBuffers.has(idx)) this.retryBuffers.set(idx, []);
        this.retryBuffers.get(idx).push({
            exchangeName: process.env.MQ_EXCHANGE_NAME,
            routingKey: `ticker.${exchange.id}.${ticker.symbol}`,
            message: ticker,
        })
    }

    _startFlushRetryLoop() {
        const flushRetryLoop = async () => {
            try {
                await this.flushAllRetryBuffers();
            } catch (e) {
                logger.error(`[TickerProducer] 재시도 버퍼 flush 실패: ${e.message}`);
            } finally {
                setTimeout(flushRetryLoop, 3000);
            }
        };

        flushRetryLoop(); // 첫 실행
    }
}

module.exports = TickerProducer;
