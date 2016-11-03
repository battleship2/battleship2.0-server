FROM mhart/alpine-node:7.0.0

COPY package.json /app/package.json

RUN cd /app \
    && npm install --production

RUN mkdir /logs

COPY src/release /app

ENTRYPOINT ["node", "/app/server.js"]
