const {logger} = require("../../utils/logger");

class TickerProducer {
    constructor({ exchangeId, chunkSize, strategy }) {
        this.exchangeId = exchangeId;
        this.chunkSize = chunkSize;
        this.strategy = strategy;
        this.exchangeInstances = [];
    }

    async run() {
        const symbols = await this.strategy.getSymbols(this.exchangeId);
        const chunks = [];

        for (let i = 0; i < symbols.length; i += this.chunkSize) {
            chunks.push(symbols.slice(i, i + this.chunkSize));
        }

        for (const chunk of chunks) {
            const exchange = await this.strategy.createExchangeInstance(this.exchangeId);
            this.exchangeInstances.push({ exchange, symbols: chunk });
            await this.startWatching(exchange, chunk);
        }
    }

    async startWatching(exchange, symbols) {
        while (true) {
            try {
                const ticker = await this.strategy.watch(exchange, symbols);
                await this.strategy.publish({
                    exchangeName: process.env.MQ_EXCHANGE_NAME,
                    routingKey: `ticker.${exchange.id}.${ticker.symbol}`,
                    message: ticker
                })
            } catch (e) {
                logger.error(`[TickerProducer] ${this.exchangeId} watch 에러 발생: ${e.message}`);
            }
        }
    }
}

module.exports = TickerProducer;
