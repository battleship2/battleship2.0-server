/// <reference path="../definitions/definitions.d.ts" />

import * as http from "http";
import Game = require("./game.class");
import Utils = require("../services/utils.service");
import Logger = require("../services/logger.service");
import BSData = require("../definitions/bsdata");
import Nickname = require("../services/nickname.service");

let __io: SocketIOStatic = require("socket.io");
let _io: SocketIO.Server = null;
let _utils: Utils = new Utils();
let _logger: Logger = null;
let _buffer: BSBuffer = { sockets: {}, games: {} };
let _instance: Socket = null;
let _nickname: Nickname = new Nickname();

class Socket {

    /**********************************************************************************/
    /*                                                                                */
    /*                                  PROPERTIES                                    */
    /*                                                                                */
    /**********************************************************************************/


    /**********************************************************************************/
    /*                                                                                */
    /*                                  CONSTRUCTOR                                   */
    /*                                                                                */
    /**********************************************************************************/

    constructor() {
        if (_utils.isNull(_instance)) {
            _instance = this;
            _logger = new Logger();
        }

        return _instance;
    }

    /**********************************************************************************/
    /*                                                                                */
    /*                                PUBLIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

    public init = (server: http.Server): Socket => {
        _io = __io.listen(server);

        _io.sockets.on("connection", (socket: SocketIO.Socket) => {
            socket.game = null;
            socket.bs_uuid = _utils.uuid();
            socket.nickname = _nickname.get();

            _buffer.sockets[socket.bs_uuid] = socket;

            socket.join("lobby");
            socket.emit(BSData.events.emit.NICKNAME, socket.nickname);

            // Player related events
            socket.on(BSData.events.on.DISCONNECT, _disconnect.bind(_instance, socket));

            // Room related events
            socket.on(BSData.events.on.JOIN_GAME, _joinGame.bind(_instance, socket));
            socket.on(BSData.events.on.LEAVE_GAME, _leaveGame.bind(_instance, socket));
            socket.on(BSData.events.on.LIST_GAME, _listGames.bind(_instance, socket));
            socket.on(BSData.events.on.CREATE_GAME, _createGame.bind(_instance, socket));

            // Game related events
            socket.on(BSData.events.on.READY, _ready.bind(_instance, socket));
            socket.on(BSData.events.on.PLAY_TURN, _playTurn.bind(_instance, socket));
            socket.on(BSData.events.on.PLACE_SHIPS, _placeShips.bind(_instance, socket));

            // Chat related events
            socket.on(BSData.events.on.MESSAGE, _message.bind(_instance, socket));
        });

        return _instance;
    };

    public reset = (): Socket => {
        _utils.forEach(_buffer.sockets, (socket: SocketIO.Socket) => {
            socket.emit(BSData.events.emit.SERVER_RESET);
            socket.leaveAll();
            socket.disconnect();
        });
        _buffer.games = {};
        _buffer.sockets = {};
        return _instance;
    };

}

/**********************************************************************************/
/*                                                                                */
/*                               PRIVATE MEMBERS                                  */
/*                                                                                */
/**********************************************************************************/

function _message(socket: SocketIO.Socket, message: string): Socket {
    let messageData = {
        id: socket.id,
        message: message,
        nickname: socket.nickname
    };

    if (_isPlaying(socket)) {
        let game = _getGame(socket);
        game.emit(_io, BSData.events.emit.MESSAGE, messageData);
    } else {
        _io.sockets.in("lobby").emit(BSData.events.emit.MESSAGE, messageData);
    }
    return _instance;
}

function _playTurn(socket: SocketIO.Socket, bomb: Array<BSAction>): Socket {
    if (_isPlaying(socket)) {
        let game = _getGame(socket);
        if (game.setNextActions(socket, bomb)) {
            socket.emit(BSData.events.emit.PLAY_TURN, true);
            if (game.hasEveryonePlayedTheTurn()) {
                let results = game.playTheTurn();
                game.emit(_io, BSData.events.emit.TURN_RESULTS, results);
                game.emit(_io, BSData.events.emit.GAME_STATE, {state: "new turn"});
            }
        } else {
            socket.emit(BSData.events.emit.PLAY_TURN, {error: "Learn how to place a bomb."});
        }
    }
    return _instance;
}

function _placeShips(socket: SocketIO.Socket, ships: Array<BSShip>): Socket {
    if (_isPlaying(socket)) {
        let game = _getGame(socket);
        if (game.state() === BSData.State.SETTING) {
            if (game.placePlayerShips(socket, ships)) {
                socket.emit(BSData.events.emit.SHIP_PLACEMENT, true);
                if (game.state() === BSData.State.PLAYING) {
                    game.emit(_io, BSData.events.emit.GAME_STATE, {state: "new turn"});
                    game.emit(_io, BSData.events.emit.NEW_ROUND);
                }
            } else {
                socket.emit(BSData.events.emit.SHIP_PLACEMENT, {error: "Learn how to place your ships."});
            }
        } else {
            socket.emit(BSData.events.emit.REFUSED, {message: "It is not the moment to place your ship."});
        }
    }
    return _instance;
}

function _ready(socket: SocketIO.Socket, ready: boolean): Socket {
    if (_isPlaying(socket)) {
        let game = _getGame(socket);
        if (game.state() === BSData.State.READY) {
            game.setPlayerReady(socket, ready);
            game.emit(_io, BSData.events.emit.PLAYER_READY, {nickname: socket.nickname, isReady: ready});
            if (game.state() === BSData.State.SETTING) {
                game.emit(_io, BSData.events.emit.GAME_STATE, {
                    state: "place ship",
                    ships: game.map.ships
                });
            }
        }
    }
    return _instance;
}

function _listGames(socket: SocketIO.Socket): Socket {
    let games = [];

    _utils.forEach(_buffer.games, (game: Game) => {
        if (game.isOpen()) {
            games.push(game.summary());
        }
    });

    socket.emit(BSData.events.emit.LIST_GAMES, games);
    return _instance;
}

function _leaveGame(socket: SocketIO.Socket): Socket {
    if (!_utils.isNull(socket.game)) {

        let game = _getGame(socket);
        game.removePlayer(socket);
        game.emit(_io, BSData.events.emit.PLAYER_LEFT, {nickname: socket.nickname});
        socket.emit(BSData.events.emit.GAME_LEFT);
        let playersCount = game.countPlayers();
        if (playersCount <= 0 || (game.state() === BSData.State.READY && !game.isStillPlayable())) {
            if (playersCount > 0) {
                game.emit(_io, BSData.events.emit.GAME_STATE, {state: "stopped"});
                game.removeAllPlayers(_buffer.sockets);
            }
            delete _buffer.games[game.getId()];
            game = null;
        }

    } else {
        socket.emit(BSData.events.emit.REFUSED, {message: "To leave a game, you first need to join one."});
    }
    return _instance;
}

function _isPlaying(socket: SocketIO.Socket): boolean {
    return _utils.isString(socket.game) && socket.game in _buffer.games;
}

function _playerData(socket: SocketIO.Socket): { id: string, nickname: string } {
    return {
        id: socket.id,
        nickname: socket.nickname
    };
}

function _getGame(socket: SocketIO.Socket): Game {
    return _buffer.games[socket.game];
}

function _disconnect(socket: SocketIO.Socket): Socket {
    if (_isPlaying(socket)) {
        _getGame(socket).removePlayer(socket);
    }
    delete _buffer.sockets[socket.bs_uuid];
    return _instance;
}

function _createGame(socket: SocketIO.Socket, data: BSGameData): Socket {
    if (!_isPlaying(socket)) {
        let game = new Game(data.name, data.maxPlayers, data.password);
        game.addPlayer(socket);
        _buffer.games[game.getId()] = game;
        socket.emit(BSData.events.emit.GAME_CREATED, game.summary());
    } else {
        socket.emit(BSData.events.emit.REFUSED, {message: "You already are in a game."});
    }
    return _instance;
}

function _joinGame(socket: SocketIO.Socket, data: BSGameData) {
    if (_utils.isDefined(data.gameId) && data.gameId in _buffer.games) {
        let game = _buffer.games[data.gameId];
        if (game.acceptPlayer(socket, data)) {
            game.addPlayer(socket);
            game.emit(_io, BSData.events.emit.NEW_PLAYER, _playerData(socket));
            if (game.state() === BSData.State.READY) {
                game.emit(_io, BSData.events.emit.GAME_STATE, {state: "ready"});
            }
        } else {
            socket.emit(BSData.events.emit.REFUSED, {message: "It appears that you cannot join this game."});
        }
    } else {
        socket.emit(BSData.events.emit.REFUSED, {message: "No game found with id: " + data.gameId});
    }
}

export = Socket;
