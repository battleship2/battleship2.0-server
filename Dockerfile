FROM mhart/alpine-node:7.0.0

RUN mkdir /app
ADD package.json /app/package.json
RUN cd /app; npm install --production
ADD app.js /app/app.js
ADD src /app/src

WORKDIR /app

EXPOSE 9001

CMD ["node", "/app/app.js"]
