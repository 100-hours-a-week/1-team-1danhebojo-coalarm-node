const client = require("prom-client");

const producerWatchLatencyMetric = new client.Gauge({
    name: "producer_watch_latency_ms",
    help: "Time taken to fetch ticker data",
    labelNames: ["producerId"],
});

const producerWatchTotalMetric = new client.Counter({
    name: "producer_watch_total",
    help: "Number of successful watch() calls",
    labelNames: ["producerId"],
});

const producerWatchErrorTotalMetric = new client.Counter({
    name: "producer_watch_error_total",
    help: "Number of failed watch() calls",
    labelNames: ["producerId"],
});

const producerPublishTotalMetric = new client.Counter({
    name: "producer_publish_total",
    help: "Number of successful publish() calls",
    labelNames: ["producerId"],
});

const producerPublishErrorTotalMetric = new client.Counter({
    name: "producer_publish_error_total",
    help: "Number of failed publish() calls",
    labelNames: ["producerId"],
});

const producerPublishLatencyMetric = new client.Gauge({
    name: "producer_publish_latency_ms",
    help: "Latency of publishing messages to MQ",
    labelNames: ["producerId"],
});

const producerRetryBufferLengthMetric = new client.Gauge({
    name: "producer_retry_buffer_length",
    help: "Length of retry buffer for failed publish",
    labelNames: ["producerId"],
});

const producerBackPressureCountMetric = new client.Counter({
    name: "producer_back_pressure_count",
    help: "Number of Back Pressure Count",
    labelNames: ["producerId"],
});

function registerProducerMetrics(register) {
    register.registerMetric(producerWatchLatencyMetric);
    register.registerMetric(producerWatchTotalMetric);
    register.registerMetric(producerWatchErrorTotalMetric);
    register.registerMetric(producerPublishTotalMetric);
    register.registerMetric(producerPublishErrorTotalMetric);
    register.registerMetric(producerPublishLatencyMetric);
    register.registerMetric(producerRetryBufferLengthMetric);
    register.registerMetric(producerBackPressureCountMetric);
}

// 외부에서 모니터링 데이터를 받아와서 각각의 메트릭 업데이트
function updateProducerMetrics({
                                   producerId,
                                   producerAvgWatchLatency,
                                   producerWatchTotal,
                                   producerWatchErrorTotal,
                                   producerAvgPublishLatency,
                                   producerPublishTotal,
                                   producerPublishErrorTotal,
                                   producerRetryBufferLength,
                                   producerBackPressureCount
                               }) {
    const labels = { producerId: String(producerId) };

    if (typeof producerWatchTotal === "number") {
        producerWatchTotalMetric.inc(labels, producerWatchTotal);
    }

    if (typeof producerWatchErrorTotal === "number") {
        producerWatchErrorTotalMetric.inc(labels, producerWatchErrorTotal);
    }

    if (typeof producerPublishTotal === "number") {
        producerPublishTotalMetric.inc(labels, producerPublishTotal);
    }

    if (typeof producerPublishErrorTotal === "number") {
        producerPublishErrorTotalMetric.inc(labels, producerPublishErrorTotal);
    }

    if (typeof producerAvgWatchLatency === "number") {
        producerWatchLatencyMetric.set(labels, producerAvgWatchLatency);
    }

    if (typeof producerAvgPublishLatency === "number") {
        producerPublishLatencyMetric.set(labels, producerAvgPublishLatency);
    }

    if (typeof producerRetryBufferLength === "number") {
        producerRetryBufferLengthMetric.set(labels, producerRetryBufferLength);
    }

    if (typeof producerBackPressureCount === "number") {
        producerBackPressureCountMetric.inc(labels, producerBackPressureCount);
    }
}

module.exports = {
    registerProducerMetrics,
    updateProducerMetrics,
};
