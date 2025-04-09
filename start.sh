#!/bin/bash

echo ""
echo "===================================="
echo "🟡 현재 실행중인 프로세스을 종료"
echo "===================================="

pm2 kill

echo ""
echo "===================================="
echo "🟡 실시간 데이터 수집 워커 & 백필 워커 실행"
echo "===================================="

pm2 start pm2.config.json --only upbit_candle,upbit_backfill

echo ""
echo "===================================="
echo "🟡 실시간 데이터 수집 워커 실행"
echo "===================================="


pm2 start pm2.config.json --only binance_ticker,upbit_ticker

echo ""
echo "===================================="
echo "🟢 모든 작업 완료"
echo "===================================="
