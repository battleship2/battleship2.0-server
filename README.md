# Websocket

## Launch

from the project's root directory type the following commands:

1. `npm install` (restify and socket.io)
2. `node app.js`

## Tests
We try to get the whole project tested.  
To launch all the tests, type the following command:

`mocha`

## Test on browser
in a browser, open the page ./www/index.html to launch a 4 players game

## Docker
to build/re-build the image, from the root of the project, type the following command:  
```shell
$ sudo docker build -t battleship2.0 .
```

to run a container
```shell
$ sudo docker run -d \
       --name <a name> \
       -p <any port>:9001 \
       battleship2.0:latest
```
