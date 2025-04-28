const client = require("prom-client");

const consumedCounter = new client.Counter({
    name: "consumer_total_consumed",
    help: "컨슈머가 총 소비한 티커 수",
    labelNames: ["consumerId"],
});

const sendToDLQCounter = new client.Counter({
    name: "consumer_send_to_dlq_total",
    help: "컨슈머가 DLQ로 보낸 총 메시지 수",
    labelNames: ["consumerId"],
});

const recoverableRetryCounter = new client.Counter({
    name: "consumer_recoverable_retry_total",
    help: "컨슈머가 recoverable error로 재시도한 총 메시지 수",
    labelNames: ["consumerId"],
});

const batchLatencyGauge = new client.Gauge({
    name: "consumer_avg_batch_latency_ms",
    help: "컨슈머의 배치 저장 평균 지연시간 (ms)",
    labelNames: ["consumerId"],
});

function registerConsumerMetrics(register) {
    register.registerMetric(consumedCounter);
    register.registerMetric(sendToDLQCounter);
    register.registerMetric(recoverableRetryCounter);
    register.registerMetric(batchLatencyGauge);
}

function updateConsumerMetrics({
                                   consumerId,
                                   consumerTotalConsumed,
                                   consumerSendToDLQTotal,
                                   consumerRecoverableRetryTotal,
                                   consumerAvgBatchLatency
                               }) {
    const labels = { consumerId: String(consumerId) };

    if (consumerTotalConsumed > 0) {
        consumedCounter.inc(labels, consumerTotalConsumed);
    }

    if (consumerSendToDLQTotal > 0) {
        sendToDLQCounter.inc(labels, consumerSendToDLQTotal);
    }
    if (consumerRecoverableRetryTotal > 0) {
        recoverableRetryCounter.inc(labels, consumerRecoverableRetryTotal);
    }
    if (consumerAvgBatchLatency > 0) {
        batchLatencyGauge.set(labels, consumerAvgBatchLatency);
    }
}

module.exports = {
    registerConsumerMetrics,
    updateConsumerMetrics,
};
