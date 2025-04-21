#!/bin/bash

 echo "🟢 [운영] PM2 워커 순차 실행"

 # 설정 값
 LIMIT=200

 # 거래소별 심볼 개수
 declare -A TOTALS=( ["upbit"]=166 ["binance"]=567 )

 # 워커 타입 목록
 TYPES=("ticker" "candle")

 # 순차 실행 루프
 for exchange in "${!TOTALS[@]}"; do
   total=${TOTALS[$exchange]}

   for type in "${TYPES[@]}"; do
     for ((offset=0; offset<total; offset+=LIMIT)); do
       name="${type}-${exchange}-${offset}"
       echo "▶️ 실행 중: $name"
       pm2 start ecosystem.prod.config.js --only "$name"
       sleep 0.5
     done
   done
 done

 echo "✅ [운영] 모든 워커 실행 완료"
 pm2 logs