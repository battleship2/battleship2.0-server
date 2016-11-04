/// <reference path="../definitions/definitions.d.ts" />

import * as http from 'http';
import Game = require('./game.class');
import Utils = require('../services/utils.service');
import Logger = require('../services/logger.service');
import BSData = require('../definitions/bsdata');
import Nickname = require('../services/nickname.service');

let __io: SocketIOStatic = require('socket.io');
let _io: SocketIO.Server = null;
let _utils: Utils = new Utils();
let _logger: Logger = null;
let _buffer: BSBuffer = { sockets: {}, games: {} };
let _instance: Socket = null;
let _nickname: Nickname = new Nickname();

// Used to hold the "enums" of the events in order to be able to simply modify them
let _events = {
    on: {},
    emit: {}
};

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

        _io.sockets.on('connection', (socket: SocketIO.Socket) => {
            socket.game = null;
            socket.nickname = _getNickname();

            _buffer.sockets[socket.nickname] = socket;

            socket.join('lobby');
            socket.emit('nickname', socket.nickname);

            // Player related events
            socket.on('disconnect',  _disconnect.bind(_instance, socket));

            // Room related events
            socket.on('join game',   _joinGame.bind(_instance, socket));
            socket.on('leave game',  _leaveGame.bind(_instance, socket));
            socket.on('list games',  _listGames.bind(_instance, socket));
            socket.on('create game', _createGame.bind(_instance, socket));

            // Game related events
            socket.on('ready',       _ready.bind(_instance, socket));
            socket.on('play turn',   _playTurn.bind(_instance, socket));
            socket.on('place ships', _placeShips.bind(_instance, socket));

            // Chat related events
            socket.on('message',     _message.bind(_instance, socket));
        });

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
        game.emit(_io, 'message', messageData);
    } else {
        _io.sockets.in('lobby').emit('message', messageData);
    }
    return _instance;
}

function _playTurn(socket: SocketIO.Socket, bomb: Array<BSAction>): Socket {
    if (_isPlaying(socket)) {
        let game = _getGame(socket);
        if (game.setNextActions(socket, bomb)) {
            socket.emit('play turn', true);
            if (game.hasEveryonePlayedTheTurn()) {
                let results = game.playTheTurn();
                game.emit(_io, 'turn results', results);
                game.emit(_io, 'game state', {state: 'new turn'});
            }
        } else {
            socket.emit('play turn', {error: 'Learn how to place a bomb.'});
        }
    }
    return _instance;
}

function _placeShips(socket: SocketIO.Socket, ships: Array<BSShip>): Socket {
    if (_isPlaying(socket)) {
        let game = _getGame(socket);
        if (game.state() === BSData.State.SETTING) {
            if (game.placePlayerShips(socket, ships)) {
                socket.emit('ship placement', true);
                if (game.state() === BSData.State.PLAYING) {
                    game.emit(_io, 'game state', {state: 'new turn'});
                    game.emit(_io, 'new round');
                }
            } else {
                socket.emit('ship placement', {error: 'Learn how to place your ships.'});
            }
        } else {
            socket.emit('refused', {message: 'It is not the moment to place your ship.'})
        }
    }
    return _instance;
}

function _ready(socket: SocketIO.Socket, ready: boolean): Socket {
    if (_isPlaying(socket)) {
        let game = _getGame(socket);
        if (game.state() === BSData.State.READY) {
            game.setPlayerReady(socket, ready);
            game.emit(_io, 'player ready', {nickname: socket.nickname, isReady: ready});
            if (game.state() === BSData.State.SETTING) {
                game.emit(_io, 'game state', {
                    state: 'place ship',
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

    socket.emit('list games', games);
    return _instance;
}

function _leaveGame(socket: SocketIO.Socket): Socket {
    if (!_utils.isNull(socket.game)) {

        let game = _getGame(socket);
        game.removePlayer(socket);
        game.emit(_io, 'player left', {nickname: socket.nickname});
        socket.emit('game left');
        let playersCount = game.countPlayers();
        if (playersCount <= 0 || (game.state() === BSData.State.READY && !game.isStillPlayable())) {
            if (playersCount > 0) {
                game.emit(_io, 'game state', {state: 'stopped'});
                game.removeAllPlayers(_buffer.sockets);
            }
            delete _buffer.games[game.getId()];
        }

    } else {
        socket.emit('refused', {message: 'To leave a game, you first need to join one.'});
    }
    return _instance;
}

function _getNickname(): string {
    let nickname = '';
    do { nickname = _nickname.get(); }
    while (nickname in _buffer.sockets);
    return nickname;
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
    delete _buffer.sockets[socket.nickname];
    return _instance;
}

function _createGame(socket: SocketIO.Socket, data: BSGameData): Socket {
    if (!_isPlaying(socket)) {
        let game = new Game(data.name, data.maxPlayers, data.password);
        game.addPlayer(socket);
        _buffer.games[game.getId()] = game;
        socket.emit('game created', game.summary());
    } else {
        socket.emit('refused', {message: 'You already are in a game.'});
    }
    return _instance;
}

function _joinGame(socket: SocketIO.Socket, data: BSGameData) {
    if (_utils.isDefined(data.gameId) && data.gameId in _buffer.games) {
        let game = _buffer.games[data.gameId];
        if (game.acceptPlayer(socket, data)) {
            game.addPlayer(socket);
            game.emit(_io, 'new player', _playerData(socket));
            if (game.state() === BSData.State.READY) {
                game.emit(_io, 'game state', {state: 'ready'});
            }
        } else {
            socket.emit('refused', {message: 'It appears that you cannot join this game.'});
        }
    } else {
        socket.emit('refused', {message: 'No game found with id: ' + data.gameId});
    }
}

export = Socket;
