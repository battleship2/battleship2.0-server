/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/bunyan/index.d.ts" />
/// <reference path="../node_modules/@types/restify/index.d.ts" />
/// <reference path="../node_modules/@types/socket.io/index.d.ts" />

declare module NodeJS  {
    interface Global {
        DEBUG_ENABLED: boolean
    }
}

interface BSGameData {
    id: string
    name: string
    password: string
    maxPlayers: number
}

interface BSBuffer {
    games: {}
    sockets: {}
}

interface BSPlayer {
    id: string
    on: Function
    game: any
    emit: Function
    nickname: string
}

enum BSGameState {
    READY,
    PLAYING,
    SETTING,
    WAITING_PLAYERS
}

(() => {
    global.DEBUG_ENABLED = require.main === module || true /*__debugEnabled__*/;

    let SocketClass: any = require('./classes/socket.class');
    let ServerClass: any = require('./classes/server.class');

    let server = new ServerClass();
    let socket = new SocketClass();

    socket.init(server.get());
    server.start();
})();
