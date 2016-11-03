# Battleship-2.0 (server)
The client repo is [here](https://github.com/battleship2/battleship2.0-client)

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

### Quick launch

```shell
$ docker-compose up --build
```

to build/re-build the image, from the root of the project, type the following command:  
```shell
$ docker build -t battleship2/server .
```

to run a container
```shell
$ docker run -p <any port>:9001 -d battleship2/server
```
