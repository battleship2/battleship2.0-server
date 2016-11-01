/// <reference path="../server.ts" />

import Game = require('./game.class');
import Utils = require('../services/utils.service');
import Nickname = require('./nickname.class');

let _io: any = require('socket.io');
let _utils: Utils = new Utils();
let _buffer: BSBuffer = {sockets: {}, games: {}};
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
        }

        return _instance;
    }

    /**********************************************************************************/
    /*                                                                                */
    /*                                PUBLIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

    public init = (server: any): Socket => {
        _io.listen(server)
            .sockets.on('connection', function (player) {

            player.game = null;
            player.nickname = _getNickname();

            _buffer.sockets[player.nickname] = player;

            player.join('lobby');
            player.emit('nickname', player.nickname);

            player.on('disconnect',  data => { _disconnect.call(_instance, player, data)});

            player.on('join game',   data => { _joinGame.call(_instance, player, data)});
            player.on('create game', data => { _createGame.call(_instance, player, data)});

            player.on('leave game', function () {
                if (player.game !== null) {
                    let game = _getGame(player);
                    game.removePlayer(player);
                    game.emit(_io, 'player left', {nickname: player.nickname});
                    player.emit('game left');
                    let playersCount = game.countPlayers();
                    if (playersCount <= 0 || (game.state() === BSGameState.READY && !game.isStillPlayable())) {
                        if (playersCount > 0) {
                            game.emit(_io, 'game state', {state: 'stopped'});
                            game.removeAllPlayers(_buffer.sockets);
                        }
                        delete _buffer.games[game.getId()];
                    }
                } else {
                    player.emit('error', {message: 'To leave a game, you first need to join one…'});
                }
            });

            player.on('list games', function () {
                let games = [];
                Object.keys(_buffer.games).forEach(function (id) {
                    if (_buffer.games[id].isOpen()) {
                        games.push(_buffer.games[id].summary());
                    }
                });
                player.emit('list games', games);
            });

            // game

            player.on('ready', function (ready) {
                if (_isPlaying(player)) {
                    let game = _getGame(player);
                    if (game.state() === BSGameState.READY) {
                        game.setPlayerReady(player, ready);
                        game.emit(_io, 'player ready', {nickname: player.nickname, isReady: ready});
                        if (game.state() === BSGameState.SETTING) {
                            game.emit(_io, 'game state', {
                                state: 'place ship',
                                ships: game.map().ships
                            });
                        }
                    }
                }
            });

            player.on('place ships', function (ships) {
                if (_isPlaying(player)) {
                    let game = _getGame(player);
                    if (game.state() === BSGameState.SETTING) {
                        if (game.placePlayerShips(player, ships)) {
                            player.emit('ship placement', true);
                            if (game.state() === BSGameState.PLAYING) {
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
            });

            player.on('play turn', function (bomb) {
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
            });

            // chat

            player.on('message', function (message) {
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
            });

        });

        return _instance;
    };

}


/**********************************************************************************/
/*                                                                                */
/*                               PRIVATE MEMBERS                                  */
/*                                                                                */
/**********************************************************************************/

function _getNickname(): string {
    let nickname = '';
    do { nickname = _nickname.get(); }
    while (nickname in _buffer.sockets);
    return nickname;
}

function _isPlaying(player: BSPlayer): boolean {
    return player.game && player.game in _buffer.games;
}

function _playerData(player: BSPlayer): { id: string, nickname: string } {
    return {
        id: player.id,
        nickname: player.nickname
    };
}

function _getGame(player: BSPlayer): Game {
    return _buffer.games[player.game];
}

function _disconnect(player: BSPlayer): Socket {
    if (_isPlaying(player)) {
        _getGame(player).removePlayer(player);
    }
    delete _buffer.sockets[player.nickname];
    return _instance;
}

function _createGame(player: BSPlayer, data: BSGameData): Socket {
    if (!_isPlaying(player)) {
        let game = new Game(_utils.uuid(), data.name, data.maxPlayers, data.password);
        game.addPlayer(player);
        _buffer.games[game.getId()] = game;
        player.emit('game created', game.summary());
    } else {
        player.emit('error', {message: 'you are already in a game.'});
    }
    return _instance;
}

function _joinGame(player: BSPlayer, data: any) {
    if (_utils.isDefined(data.gameId) && data.gameId in _buffer.games) {
        let game = _buffer.games[data.gameId];
        if (game.acceptPlayer(player, data)) {
            game.addPlayer(player);
            game.emit(_io, 'new player', _playerData(player));
            if (game.state() === BSGameState.READY) {
                game.emit(_io, 'game state', {state: 'ready'});
            }
        } else {
            player.emit('refused');
        }
    } else {
        player.emit('error', {message: 'no game with id ' + data.gameId});
    }
}

export = Socket;
