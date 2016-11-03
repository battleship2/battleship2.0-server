# Battleship2.0 | Server repository
This is the server-side repository of the `Battleship2.0` game.
The client (game) repository is hosted at [https://github.com/battleship2/battleship2.0-client](https://github.com/battleship2/battleship2.0-client).

## Dependencies
The server relies on several well-known libraries such as:
- [Socket.IO](http://socket.io/)
- [Mocha](https://mochajs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Restify](http://restify.com/)
- [Gulp](http://gulpjs.com/)
- ...

**Important note about Gulp:**
_The project is configured to use Gulp v4 and above.
Please refer to this [link](https://demisx.github.io/gulp4/2015/01/15/install-gulp4.html) to check how to configure it in your environment._

## Launch
From the project's root directory, type the following commands:

1. `npm install` -> Install the required dependencies
2. `gulp` or `gulp serve` or `npm start` -> Start the project using nodemon and bunyan to have a bulletproof server carrying fabulous logging

## Tests, Bugs & Contributions
While we do our best to get the whole project tested, do not hesitate to PR us if you ever find a bug. 
To launch all the tests, type the following command:

`gulp test` or `npm test`

### Testing in a browser
First, run the server using the [Launch](https://github.com/battleship2/battleship2.0-server#launch) section abive.
Then, in your favorite browser, open the `index.html` file located under `www` to launch a 4 players game.

## Docker

### Quick launch

```shell
$ docker-compose up --build
```

To build or re-build the image, from the root of the project, type the following command:  

```shell
$ docker build -t battleship2/server .
```

To run a container
```shell
$ docker run -p <any port>:9001 -d battleship2/server
```
