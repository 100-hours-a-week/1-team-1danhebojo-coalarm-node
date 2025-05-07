const { Client } = require("pg");
const { logger } = require("./logger");

const RETRY_DELAY_MS = 3000;
const MAX_RETRIES = 5;

class ReconnectingClient {
    constructor(config) {
        this.config = config;
        this.client = new Client(config);
        this.connected = false;
        this.retryCount = 0;
    }

    async connect() {
        while (this.retryCount < MAX_RETRIES) {
            try {
                await this.client.connect();
                this.connected = true;
                logger.info(`DB 커넥션 연결 성공`);
                this._attachErrorHandlers();
                return;
            } catch (e) {
                logger.error(`DB 커넥션 연결 실패 (재시도 ${this.retryCount + 1}/${MAX_RETRIES})`, e);
                this.retryCount++;
                await this._delay(RETRY_DELAY_MS);
            }
        }

        throw new Error("DB 커넥션 연결 실패: 재시도 초과");
    }

    _attachErrorHandlers() {
        this.client.on("error", async (err) => {
            logger.error("DB 커넥션 오류 발생", err);
            this.connected = false;

            try {
                await this.reconnect();
            } catch (e) {
                logger.error("DB 커넥션 재연결 실패", e);
            }
        });
    }

    async reconnect() {
        logger.warn("DB 커넥션 재연결 시도...");
        this.client.end().catch(() => {});
        this.client = new Client(this.config);
        this.retryCount = 0;
        await this.connect();
    }

    async query(text, params) {
        if (!this.connected) {
            logger.info("연결되지 않은 상태, 재연결 시도");
            await this.reconnect();
        }

        try {
            return await this.client.query(text, params);
        } catch (err) {
            if (err.code === 'ECONNRESET' || err.code === '57P01') {
                logger.warn("쿼리 실패로 인한 재연결 시도");
                await this.reconnect();
                return await this.client.query(text, params);
            }

            throw err;
        }
    }

    async end() {
        await this.client.end();
        this.connected = false;
        logger.info("DB 연결 종료");
    }

    _delay(ms) {
        return new Promise((res) => setTimeout(res, ms));
    }
}

module.exports = { ReconnectingClient };