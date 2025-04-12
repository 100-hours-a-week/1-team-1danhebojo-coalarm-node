# Node.js LTS 이미지 사용
FROM node:18

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# 종속성 설치
COPY package*.json ./
RUN npm install -g pm2 && npm install

# 소스 코드 복사
COPY . .

# 실행 권한 부여
RUN chmod +x prod-start.sh

# Entrypoint 사용 (더 일반적이고 권장됨)
ENTRYPOINT ["./prod-start.sh"]