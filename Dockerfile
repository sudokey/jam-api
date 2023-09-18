FROM node:alpine

WORKDIR /app

CMD ["sh", "-c", "npm install && npm start"]
