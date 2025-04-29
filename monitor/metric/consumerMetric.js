const client = require("prom-client");

const consumedCount = new client.Gauge({
    name: "consumer_total_consumed",
    help: "컨슈머가 총 소비한 티커 수",
    labelNames: ["consumerId"],
});

const sendToDLQCount = new client.Gauge({
    name: "consumer_send_to_dlq_total",
    help: "컨슈머가 DLQ로 보낸 총 메시지 수",
    labelNames: ["consumerId"],
});

const recoverableRetryCount = new client.Gauge({
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
    register.registerMetric(consumedCount);
    register.registerMetric(sendToDLQCount);
    register.registerMetric(recoverableRetryCount);
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
        consumedCount.set(labels, consumerTotalConsumed);
    }

    if (consumerSendToDLQTotal > 0) {
        sendToDLQCount.set(labels, consumerSendToDLQTotal);
    }
    if (consumerRecoverableRetryTotal > 0) {
        recoverableRetryCount.set(labels, consumerRecoverableRetryTotal);
    }
    if (consumerAvgBatchLatency > 0) {
        batchLatencyGauge.set(labels, consumerAvgBatchLatency);
    }
}

module.exports = {
    registerConsumerMetrics,
    updateConsumerMetrics,
};
