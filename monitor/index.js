require('dotenv').config();

const express = require("express");
const client = require("prom-client");
const bodyParser = require("body-parser");
const { registerWorkerMetrics, updateWorkerMetrics } = require("./metric");
const { registerProducerMetrics, updateProducerMetrics} = require("./metric/producerMetric")
const { registerConsumerMetrics, updateConsumerMetrics} = require("./metric/consumerMetric")
const app = express();
const register = new client.Registry();

const NODE_ENV = process.env.NODE_ENV;
if (NODE_ENV === 'producer') {
    registerProducerMetrics(register);
} else if (NODE_ENV === 'consumer') {
    registerConsumerMetrics(register);
} else {
    registerWorkerMetrics(register);
}

client.collectDefaultMetrics({ register });

app.use(bodyParser.json());

// 워커로부터 TPS를 받아오는 엔드포인트
app.post("/report", (req, res) => {
    const { workerId, tps, error, latency } = req.body;

    if (!workerId) {
        return res.status(400).json({ error: "Invalid Payload" });
    }

    updateWorkerMetrics({workerId, tps, error, latency});
    res.status(200).json({ status: "OK" });
});

if (NODE_ENV === 'producer') {
    app.post("/report/producer", (req, res) => {
        const {
            producerId,
            producerAvgWatchLatency,
            producerWatchTotal,
            producerWatchErrorTotal,
            producerAvgPublishLatency,
            producerPublishTotal,
            producerPublishErrorTotal,
            producerRetryBufferLength,
            producerBackPressureCount
        } = req.body;

        if (!producerId) {
            return res.status(400).json({ error: "Invalid Payload" });
        }

        updateProducerMetrics({
            producerId,
            producerAvgWatchLatency,
            producerWatchTotal,
            producerWatchErrorTotal,
            producerAvgPublishLatency,
            producerPublishTotal,
            producerPublishErrorTotal,
            producerRetryBufferLength,
            producerBackPressureCount
        })

        res.status(200).json({ status: "OK" });
    });

}

if (NODE_ENV === 'consumer') {
    app.post("/report/consumer", (req, res) => {
        const {
            consumerId,
            consumerTotalConsumed,
            consumerSendToDLQTotal,
            consumerRecoverableRetryTotal,
            consumerAvgBatchLatency
        } = req.body;

        if (!consumerId) {
            return res.status(400).json({ error: "Invalid Payload" });
        }

        updateConsumerMetrics({
            consumerId,
            consumerTotalConsumed,
            consumerSendToDLQTotal,
            consumerRecoverableRetryTotal,
            consumerAvgBatchLatency
        })

        res.status(200).json({ status: "OK" });
    });
}


// Prometheus scrape endpoint
app.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

app.listen(9101, () => {
    console.log("Monitoring server listening on port 9101");
});