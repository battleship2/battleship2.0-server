/// <reference path="../definitions/definitions.d.ts" />

import Game = require("../classes/game.class");
import Utils = require("../services/utils.service");
import BSData = require("../definitions/bsdata");
import Socket = require("../classes/socket.class");
import BSPlugin = require("../plugins/abstract.bsplugin");
import ShipFactory = require("../classes/ships/ship.factory");

let _utils: Utils = new Utils();

class GamePlugin extends BSPlugin {

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

    public setup(socket: Socket): GamePlugin {
        this._socket = socket;

        this._socket.socket.on(BSData.events.on.READY, _ready.bind(this));
        this._socket.socket.on(BSData.events.on.PLAY_TURN, _playTurn.bind(this));
        this._socket.socket.on(BSData.events.on.PLACE_SHIPS, _placeShips.bind(this));

        return this;
    };

    public stop(): GamePlugin {
        return this;
    };

}

/**********************************************************************************/
/*                                                                                */
/*                               PRIVATE MEMBERS                                  */
/*                                                                                */
/**********************************************************************************/

function _playTurn(bomb: Array<BSAction>): GamePlugin {
    if (!_utils.isNull(this._socket.game)) {
        let game = this._socket.game;
        if (game.setNextActions(this._socket, bomb)) {
            this._socket.socket.emit(BSData.events.emit.PLAY_TURN, true);
            if (game.hasEveryonePlayedTheTurn()) {
                let results = game.playTheTurn();
                this._socket.dispatch(BSData.events.emit.TURN_RESULTS, results);
                this._socket.dispatch(BSData.events.emit.GAME_STATE, {state: "new turn"});
            }
        } else {
            this._socket.socket.emit(BSData.events.emit.PLAY_TURN, {error: "Learn how to place a bomb."});
        }
    }
    return this;
}

function _placeShips(ships: Array<BSShip>): GamePlugin {
    if (!_utils.isNull(this._socket.game)) {
        let game = this._socket.game;
        if (game.state === BSData.State.SETTING) {
            if (game.placePlayerShips(this._socket, ShipFactory.getShips(ships))) {
                this._socket.socket.emit(BSData.events.emit.SHIP_PLACEMENT, true);
                if (game.state === BSData.State.PLAYING) {
                    this._socket.dispatch(BSData.events.emit.GAME_STATE, {state: "new turn"});
                    this._socket.dispatch(BSData.events.emit.NEW_ROUND);
                }
            } else {
                this._socket.socket.emit(BSData.events.emit.SHIP_PLACEMENT, {error: "Learn how to place your ships."});
            }
        } else {
            this._socket.socket.emit(BSData.events.emit.REFUSED, {message: "It is not the moment to place your ship."});
        }
    }
    return this;
}

function _ready(ready: boolean): GamePlugin {
    if (!_utils.isNull(this._socket.game)) {
        let game = this._socket.game;
        if (game.state === BSData.State.READY) {
            game.setPlayerReady(this._socket, ready);
            this._socket.dispatch(BSData.events.emit.PLAYER_READY, {nickname: this._socket.nickname, isReady: ready});
            if (game.state === BSData.State.SETTING) {
                this._socket.dispatch(BSData.events.emit.GAME_STATE, {
                    state: "place ship",
                    ships: game.map.ships
                });
            }
        }
    }
    return this;
}

export = GamePlugin;
