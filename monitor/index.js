const express = require("express");
const client = require("prom-client");
const bodyParser = require("body-parser");
const { registerWorkerMetrics, updateWorkerMetrics } = require("./metric");

const app = express();
const register = new client.Registry();

client.collectDefaultMetrics({ register });
registerWorkerMetrics(register);

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

app.post("/report/producer", (req, res) => {
    const { workerId, tps, error, latency } = req.body;

    if (!workerId) {
        return res.status(400).json({ error: "Invalid Payload" });
    }

    updateWorkerMetrics({workerId, tps, error, latency});
    res.status(200).json({ status: "OK" });
});

app.post("/report/consumer", (req, res) => {
    const { workerId, tps, error, latency } = req.body;

    if (!workerId) {
        return res.status(400).json({ error: "Invalid Payload" });
    }

    updateWorkerMetrics({workerId, tps, error, latency});
    res.status(200).json({ status: "OK" });
});

// Prometheus scrape endpoint
app.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

app.listen(9101, () => {
    console.log("Monitoring server listening on port 9101");
});