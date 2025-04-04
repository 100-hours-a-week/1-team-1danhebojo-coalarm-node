#!/bin/bash

echo "===================================="
echo "🟡 [1/2] 심볼 최신화 워커 실행"
echo "===================================="

node ./app/core/worker/loadSymbolWorker.js
EXIT_CODE=$?

if [ $EXIT_CODE -eq 1 ]; then
  echo "❌ 심볼 최신화 워커 실패."
fi

echo ""
echo "===================================="
echo "🟢 [2/2] 데이터 수집 워커 실행"
echo "===================================="

pm2 kill
pm2 start pm2.config.json --only binance_ticker,upbit_ticker

echo ""
echo "✅ 모든 작업 완료"