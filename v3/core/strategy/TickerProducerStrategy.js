const ccxt = require('ccxt');
const ccxtpro = ccxt.pro;
const mq = require('../../utils/RabbitMQProducer');

class TickerProducerStrategy {
    constructor() {}

    async getSymbols(exchangeId) {
        const exchange = new ccxtpro[exchangeId]({
            enableRateLimit: true,
            options: {
                defaultType: "spot",
            },
        });

        await exchange.loadMarkets();

        return Object.values(exchange.markets)
            .filter(m => ['KRW', 'USDT'].includes(m.quote) && m.active)
            .map(m => m.symbol);
    }

    async createExchangeInstance(exchangeId) {
        return new ccxtpro[exchangeId]({
            enableRateLimit: true,
            options: {
                defaultType: "spot",
            },
        });
    }

    async watch(exchange, symbols) {
        return await exchange.watchTickers(symbols);
    }

    async publish() {
        await mq.publish();
    }
}

module.exports = TickerProducerStrategy;