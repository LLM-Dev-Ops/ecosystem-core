FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY dist/src/server.js ./dist/src/server.js

ENV PORT=8080
ENV npm_package_version=1.0.0
EXPOSE 8080

CMD ["node", "dist/src/server.js"]
