FROM node:20-alpine

WORKDIR /app

COPY dist/src/server.js ./dist/src/server.js
COPY dist/src/handlers/ ./dist/src/handlers/

ENV PORT=8080
ENV npm_package_version=1.0.0
EXPOSE 8080

CMD ["node", "dist/src/server.js"]
