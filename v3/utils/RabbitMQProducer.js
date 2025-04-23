// utils/RabbitMQProducer.js
const amqp = require("amqplib");
const { logger } = require("./logger");

class RabbitMQProducer {
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

    async publish({exchangeName, routingKey, message}) {
        let delay = 50;

        while (true) {
            try {
                const channel = await this.getChannel(exchangeName);
                const ok = channel.publish(
                    exchangeName,
                    routingKey,
                    Buffer.from(JSON.stringify(message)),
                    { persistent: true }
                );

                if (ok) return;

                logger.warn(`[RabbitMQ] Write Buffer 가득 참 : ${routingKey}`);
                // TODO : 메트릭 수집

                await new Promise(res => setTimeout(res, delay));
                delay = Math.min(delay * 2, 1000);

            } catch (err) {
                logger.error(`[RabbitMQ] 메시지 발행 실패: ${err.message}`);
                await new Promise(res => setTimeout(res, delay));
                delay = Math.min(delay * 2, 1000);
            }
        }
    }

}

module.exports = new RabbitMQProducer();