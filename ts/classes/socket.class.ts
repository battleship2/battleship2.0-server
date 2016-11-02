/// <reference path="../definitions/definitions.d.ts" />

import Game = require('./game.class');
import Utils = require('../services/utils.service');
import Logger = require('../services/logger.service');
import BSData = require('../definitions/bsdata');
import Nickname = require('../services/nickname.service');

let __io: any = require('socket.io');
let _io: any = null;
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

    public init = (server: any): Socket => {
        _io = __io.listen(server);

        _io.sockets.on('connection', socket => {
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

function _message(player: BSPlayer, message: string): Socket {
    _logger.debug('_message:', message);

    let messageData = {
        id: player.id,
        nickname: player.nickname,
        message: message
    };

    if (_isPlaying(player)) {
        let game = _getGame(player);
        game.emit(_io, 'message', messageData);
    } else {
        _io.sockets.in('lobby').emit('message', messageData);
    }
    return _instance;
}

function _playTurn(player: BSPlayer, bomb: Array<BSAction>): Socket {
    _logger.debug('_playTurn:', bomb);

    if (_isPlaying(player)) {
        let game = _getGame(player);
        if (game.setNextActions(player, bomb)) {
            player.emit('play turn', true);
            if (game.hasEveryonePlayedTheTurn()) {
                let results = game.playTheTurn();
                game.emit(_io, 'turn results', results);
                game.emit(_io, 'game state', {state: 'new turn'});
            }
        } else {
            player.emit('play turn', {error: 'learn how to place a bomb…'});
        }
    }
    return _instance;
}

function _placeShips(player: BSPlayer, ships: Array<BSShip>): Socket {
    _logger.debug('_placeShips:', ships);

    if (_isPlaying(player)) {
        let game = _getGame(player);
        if (game.state() === BSData.State.SETTING) {
            if (game.placePlayerShips(player, ships)) {
                player.emit('ship placement', true);
                if (game.state() === BSData.State.PLAYING) {
                    game.emit(_io, 'game state', {state: 'new turn'});
                    game.emit(_io, 'new round');
                }
            } else {
                player.emit('ship placement', {error: 'learn how to place your ships…'});
            }
        } else {
            player.emit('error', {message: 'it is not the moment to place your ship'})
        }
    }
    return _instance;
}

function _ready(player: BSPlayer, ready: boolean): Socket {
    _logger.debug('_ready:', ready);

    if (_isPlaying(player)) {
        let game = _getGame(player);
        if (game.state() === BSData.State.READY) {
            game.setPlayerReady(player, ready);
            game.emit(_io, 'player ready', {nickname: player.nickname, isReady: ready});
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

function _listGames(player: BSPlayer): Socket {
    _logger.debug('_listGames');

    let games = [];

    _utils.forEach(_buffer.games, game => {
        if (game.isOpen()) {
            games.push(game.summary());
        }
    });

    player.emit('list games', games);
    return _instance;
}

function _leaveGame(player: BSPlayer): Socket {
    _logger.debug('_leaveGame');

    if (player.game !== null) {

        let game = _getGame(player);
        game.removePlayer(player);
        game.emit(_io, 'player left', {nickname: player.nickname});
        player.emit('game left');
        let playersCount = game.countPlayers();
        if (playersCount <= 0 || (game.state() === BSData.State.READY && !game.isStillPlayable())) {
            if (playersCount > 0) {
                game.emit(_io, 'game state', {state: 'stopped'});
                game.removeAllPlayers(_buffer.sockets);
            }
            delete _buffer.games[game.getId()];
        }

    } else {
        player.emit('error', {message: 'To leave a game, you first need to join one…'});
    }
    return _instance;
}

function _getNickname(): string {
    _logger.debug('_getNickname');

    let nickname = '';
    do { nickname = _nickname.get(); }
    while (nickname in _buffer.sockets);
    return nickname;
}

function _isPlaying(player: BSPlayer): boolean {
    _logger.debug('_isPlaying');

    return player.game && player.game in _buffer.games;
}

function _playerData(player: BSPlayer): { id: string, nickname: string } {
    _logger.debug('_playerData');

    return {
        id: player.id,
        nickname: player.nickname
    };
}

function _getGame(player: BSPlayer): Game {
    _logger.debug('_getGame');

    return _buffer.games[player.game];
}

function _disconnect(player: BSPlayer): Socket {
    _logger.debug('_disconnect');

    if (_isPlaying(player)) {
        _getGame(player).removePlayer(player);
    }
    delete _buffer.sockets[player.nickname];
    return _instance;
}

function _createGame(player: BSPlayer, data: any): Socket {
    _logger.debug('_createGame:', data);

    if (!_isPlaying(player)) {
        let game = new Game(data.name, data.maxPlayers, data.password);
        game.addPlayer(player);
        _buffer.games[game.getId()] = game;
        player.emit('game created', game.summary());
    } else {
        player.emit('error', {message: 'you are already in a game.'});
    }
    return _instance;
}

function _joinGame(socket: BSPlayer, data: { gameId: string }) {
    _logger.debug('_joinGame:', data);

    if (_utils.isDefined(data.gameId) && data.gameId in _buffer.games) {
        let game = _buffer.games[data.gameId];
        if (game.acceptPlayer(socket, data)) {
            game.addPlayer(socket);
            game.emit(_io, 'new player', _playerData(socket));
            if (game.state() === BSData.State.READY) {
                game.emit(_io, 'game state', {state: 'ready'});
            }
        } else {
            socket.emit('refused');
        }
    } else {
        socket.emit('refused', {message: 'no game with id ' + data.gameId});
    }
}

export = Socket;
