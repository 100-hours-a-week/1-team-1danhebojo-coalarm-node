const mq = require('../../utils/RabbitMQConsumer');
const { saveBatchTickers } = require('../../utils/query');
class TickerConsumerStrategy {
    constructor() {}

    async save({exchangeId, tickers}) {
        await saveBatchTickers({exchangeId, tickers});
    }

    async consume({exchangeName, queueName, bindingKey, prefetch, onMessage}) {
        await mq.consume({
            exchangeName,
            queueName,
            bindingKey,
            prefetch,
            onMessage
        });
    }
}

module.exports = TickerConsumerStrategy;