FROM mhart/alpine-node:7.0.0

COPY package.json /app/package.json

RUN cd /app \
    && npm install --production

COPY app.js /app/app.js
COPY src /app/src

ENTRYPOINT ["node", "/app/app.js"]
