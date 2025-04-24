const amqp = require("amqplib");
const { logger } = require("./logger");

class RabbitMQConsumer {
    constructor() {
        this.connection = null;
        this.channels = new Map();
        this.reconnecting = false;
        this.retryDelay = 3000;
    }

    async connect() {
        if (this.connection) return;

        try {
            this.connection = await amqp.connect({
                hostname: process.env.RABBITMQ_HOST,
                port: parseInt(process.env.RABBITMQ_PORT || "5672", 10),
                username: process.env.RABBITMQ_USER,
                password: process.env.RABBITMQ_PASS,
            });

            this.connection.on("error", async (err) => {
                logger.error(`[RabbitMQ] 연결에 오류가 발생했습니다: ${err.message}`);
                await this._retryConnect();
            });

            this.connection.on("close", async () => {
                logger.warn("[RabbitMQ] 연결이 닫혔습니다");
                await this._retryConnect();
            });

            logger.info("[RabbitMQ] 연결에 성공했습니다");
        } catch (err) {
            logger.error(`[RabbitMQ] 연결에 실패했습니다: ${err.message}`);
            await this._retryConnect();
        }
    }

    async _retryConnect() {
        if (this.reconnecting) return;
        logger.info("[RabbitMQ] 재연결을 시도합니다");
        this.reconnecting = true;

        setTimeout(async () => {
            this.channels.clear();
            this.connection = null;
            try {
                await this.connect();
                logger.info("[RabbitMQ] 재연결에 성공했습니다");
            } catch (err) {
                logger.error("[RabbitMQ] 재연결에 실패했습니다");
            } finally {
                this.reconnecting = false;
            }
        }, this.retryDelay);
    }

    async getChannel(exchangeName) {
        await this.connect();

        const cachedChannel = this.channels.get(exchangeName);
        if (cachedChannel) return cachedChannel;

        // Channel이 없거나 유효하지 않은 경우 새로 생성한다.
        const newChannel = await this.connection.createChannel();
        await newChannel.assertExchange(exchangeName, "topic", { durable: true });

        this.channels.set(exchangeName, newChannel);
        return newChannel;
    }

    async close() {
        for (const ch of this.channels.values()) {
            await ch.close();
        }
        if (this.connection) await this.connection.close();
        this.channels.clear();
        this.connection = null;
    }

    async consume({ exchangeName, queueName, bindingKey, prefetch, onMessage }) {
        const channel = await this.getChannel(exchangeName);
        await channel.assertExchange('dlx.exchange', 'topic', { durable: true });
        await channel.assertQueue('dlq.ticker', { durable: true })
        await channel.bindQueue('dlq.ticker', 'dlx.exchange', '#');

        await channel.assertQueue(queueName, {
            durable: true,
            arguments: {
                'x-dead-letter-exchange': 'dlx.exchange',
                'x-dead-letter-routing-key': 'ticker.dead'
            }
        });
        await channel.bindQueue(queueName, exchangeName, bindingKey);
        await channel.prefetch(prefetch);

        await channel.consume(queueName, async (msg) => {
            if (!msg) return;
            await onMessage(msg, channel);
        }, {noAck: false});
    }
}

module.exports = new RabbitMQConsumer();