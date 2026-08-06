FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY subscribe.js ./

RUN mkdir -p /app/data
VOLUME /app/data

EXPOSE 3000

CMD ["node", "subscribe.js"]
