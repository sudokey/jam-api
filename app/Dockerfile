FROM node:alpine

WORKDIR /app

COPY . .

CMD ["sh", "-c", "npm ci && npm run build && npm run server"]

EXPOSE 2222
