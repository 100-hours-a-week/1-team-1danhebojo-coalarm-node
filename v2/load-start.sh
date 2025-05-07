#!/bin/bash

echo "🟢 [로드 테스트] PM2 워커 순차 실행 시작"

# 설정 값
COUNT=1
TYPE="ticker"
EXCHANGE="upbit"

# ecosystem 파일 이름
ECOSYSTEM="ecosystem.load.config.js"

# 실행 루프
for ((i = 0; i < COUNT; i++)); do
  NAME="${TYPE}-${EXCHANGE}-${i}"
  echo "▶️ 실행 중: $NAME"
  pm2 start "$ECOSYSTEM" --only "$NAME"

  # 실행 중간 딜레이 (0.5초)
  sleep 0.5
done

echo "✅ [로드 테스트] 모든 워커 실행 완료"

# 로그 출력
pm2 logs
