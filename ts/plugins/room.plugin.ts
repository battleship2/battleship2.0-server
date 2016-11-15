/// <reference path="../definitions/definitions.d.ts" />

import Game = require("../classes/game.class");
import Utils = require("../services/utils.service");
import BSData = require("../definitions/bsdata");
import Socket = require("../classes/socket.class");
import BSPlugin = require("../plugins/abstract.bsplugin");

let _utils: Utils = new Utils();

class RoomPlugin extends BSPlugin {

    /**********************************************************************************/
    /*                                                                                */
    /*                                  PROPERTIES                                    */
    /*                                                                                */
    /**********************************************************************************/

    private _socket: Socket = null;

    /**********************************************************************************/
    /*                                                                                */
    /*                                  CONSTRUCTOR                                   */
    /*                                                                                */
    /**********************************************************************************/

    constructor() {
        super();
    }

    /**********************************************************************************/
    /*                                                                                */
    /*                                PUBLIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

    public setup(socket: Socket): RoomPlugin {
        this._socket = socket;

        this._socket.socket.on(BSData.events.on.JOIN_GAME, _joinGame.bind(this));
        this._socket.socket.on(BSData.events.on.LEAVE_GAME, _leaveGame.bind(this));
        this._socket.socket.on(BSData.events.on.LIST_GAMES, _listGames.bind(this));
        this._socket.socket.on(BSData.events.on.CREATE_GAME, _createGame.bind(this));

        return this;
    };

    public stop(): RoomPlugin {
        return this;
    };

}

/**********************************************************************************/
/*                                                                                */
/*                               PRIVATE MEMBERS                                  */
/*                                                                                */
/**********************************************************************************/

function _listGames(): RoomPlugin {
    let games = [];

    _utils.forEach(Game.games, (game: Game) => {
        if (game.isOpen()) {
            games.push(game.summary());
        }
    });

    this._socket.socket.emit(BSData.events.emit.LIST_GAMES, games);
    return this;
}

function _leaveGame(): RoomPlugin {
    if (!_utils.isNull(this._socket.game)) {

        let game = this._socket.game;
        game.removePlayer(this._socket);
        this._socket.dispatch(BSData.events.emit.PLAYER_LEFT, {nickname: this._socket.nickname});
        this._socket.socket.emit(BSData.events.emit.GAME_LEFT);

        let playersCount = game.playersCount;
        if (playersCount <= 0 || (game.state === BSData.State.READY && !game.isStillPlayable())) {
            if (playersCount > 0) {
                this._socket.dispatch(BSData.events.emit.GAME_STATE, {state: "stopped"});
                game.removeAllPlayers();
            }
            delete Game.games[game.id];
            game = null;
        }

    } else {
        this._socket.socket.emit(BSData.events.emit.REFUSED, {message: "To leave a game, you first need to join one."});
    }
    return this;
}

function _joinGame(data: BSGameData): RoomPlugin {
    if (_utils.isDefined(data.gameId) && data.gameId in Game.games) {
        let game = Game.games[data.gameId];
        if (game.acceptPlayer(this._socket, data)) {
            game.addPlayer(this._socket);
            this._socket.dispatch(BSData.events.emit.NEW_PLAYER, _playerData(this._socket));
            if (game.state === BSData.State.READY) {
                this._socket.dispatch(BSData.events.emit.GAME_STATE, {state: "ready"});
            }
        } else {
            this._socket.socket.emit(BSData.events.emit.REFUSED, {message: "It appears that you cannot join this game."});
        }
    } else {
        this._socket.socket.emit(BSData.events.emit.REFUSED, {message: "No game found with id: " + data.gameId});
    }

    return this;
}

function _createGame(data: BSGameData): RoomPlugin {
    if (_utils.isNull(this._socket.game)) {
        let game = new Game(data.name, data.maxPlayers, data.password);
        game.addPlayer(this._socket);
        this._socket.socket.emit(BSData.events.emit.GAME_CREATED, game.summary());
    } else {
        this._socket.socket.emit(BSData.events.emit.REFUSED, {message: "You already are in a game."});
    }
    return this;
}

function _playerData(socket: Socket): { id: string, nickname: string } {
    return {
        id: socket.bs_uuid,
        nickname: socket.nickname
    };
}

export = RoomPlugin;
