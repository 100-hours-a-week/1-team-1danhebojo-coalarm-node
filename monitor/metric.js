const client = require("prom-client");

const tpsGauge = new client.Gauge({
    name: "worker_tps",
    help: "워커 당 TPS",
    labelNames: ["worker_id"],
});

const errorCounter = new client.Counter({
    name: "worker_error_total",
    help: "워커 당 총 에러 발생 수",
    labelNames: ["worker_id"],
});

const latencyGauge = new client.Gauge({
    name: "worker_watch_latency_ms",
    help: "워커 당 watch() ~ save()의 평균 지연시간 (ms)",
    labelNames: ["worker_id"],
});

function registerWorkerMetrics(register) {
    register.registerMetric(tpsGauge);
    register.registerMetric(errorCounter);
    register.registerMetric(latencyGauge);
}

// 외부에서 모니터링 데이터를 받아와서 각각의 메트릭 업데이트
function updateWorkerMetrics({ workerId, tps = 0, error = 0, latency = 0 }) {
    tpsGauge.set({ worker_id: workerId }, tps);
    errorCounter.inc({ worker_id: workerId }, error);
    if (latency > 0) {
        latencyGauge.set({ worker_id: workerId }, latency);
    }
}

module.exports = {
    registerWorkerMetrics,
    updateWorkerMetrics,
};