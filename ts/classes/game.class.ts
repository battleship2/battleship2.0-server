/// <reference path="../definitions/definitions.d.ts" />

import Utils = require("../services/utils.service");
import BSData = require("../definitions/bsdata");
import GameLogic = require("../logics/game.logic");
import Map = require("./map.class");
import Ship = require("./entities/entity.ship.class");

let _utils: Utils = new Utils();

class Game {

    /**********************************************************************************/
    /*                                                                                */
    /*                                  PROPERTIES                                    */
    /*                                                                                */
    /**********************************************************************************/

    public map: Map;
    public name: string = "";
    public logic: GameLogic = new GameLogic();
    public players: BSPlayerRegistry = {};
    public actions: BSActionRegistry = {};
    public history: Array<BSActionRegistry> = [];
    public password: string = "";
    public maxPlayers: number = 4;
    public socketRoomName: string = "UNNAMED";

    private _id: string = _utils.uuid();
    private _state: BSData.State = BSData.State.WAITING_PLAYERS;

    /**********************************************************************************/
    /*                                                                                */
    /*                                  CONSTRUCTOR                                   */
    /*                                                                                */
    /**********************************************************************************/

    constructor(name: string, maxPlayers: number, password: string = "") {
        this.map = new Map({x: 10, y: 10});
        this.map.setActionsLimit(1, []);
        this.map.setShips([{type: BSData.ShipType.DESTROYER, amount: 1}]);
        this.name = name;
        this.password = password;
        this.maxPlayers = maxPlayers >= 2 && maxPlayers <= 10 ? maxPlayers : 4;
        this.socketRoomName = "/game/" + this._id + "-" + this.name;
    }

    /**********************************************************************************/
    /*                                                                                */
    /*                                PUBLIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

    public state = (__state?: BSData.State) : BSData.State => {

        if (_utils.isUndefined(__state)) {
            return this._state;
        }

        this._state = __state;
        return this._state;
    };

    public getId = () : string => {
        return this._id;
    };

    public hasEveryonePlayedTheTurn = () : boolean => {
        try {
            _utils.forEach(this.players, (player, nickname) => {
                if (_utils.isUndefined(this.actions[nickname])) {
                    throw new Error();
                }
            });
        }
        catch (exception) { return false; }
        return true;
    };

    public isOpen = () : boolean => {
        return this.state() === BSData.State.WAITING_PLAYERS && _hasAvailableSlot.call(this);
    };

    public isStillPlayable = () : boolean => {
        return this.countPlayers() >= 2;
    };

    public emit = (io: SocketIO.Server, event: string, data?: any) : Game => {
        if (_utils.isUndefined(data)) {
            io.sockets.in(this.socketRoomName).emit(event);
        } else {
            io.sockets.in(this.socketRoomName).emit(event, data);
        }
        return this;
    };

    public countPlayers = () : number => {
        return this.getPlayersList().length;
    };

    public getPlayersList = () : Array<string> => {
        return Object.keys(this.players);
    };

    public playTheTurn = () : {} => {
        let actions = this.logic.processTurn(this.map, this.actions);
        let scores = _getTurnScores.call(this, actions);

        _updateBoards.call(this, actions);
        _updatePlayersInfos.call(this, scores);

        this.history.push(JSON.parse(JSON.stringify(this.actions)));
        this.actions = {};

        return {
            actions: actions,
            turnScores: scores,
            players: this.getPlayersInfos()
        };
    };

    public getPlayersInfos = () : Array<BSPlayerInfo> => {
        let infos = [];

        _utils.forEach(this.map.boards, (board: BSMapBoard, nickname: string) => {
            let playerInfo: BSPlayerInfo = {
                score: this.players[nickname].score,
                health: 0,
                nickname: nickname,
                maxHealth: 0
            };

            _utils.forEach(board.ships, (ship: Ship) => {
                let shipHealth = ship.dimensions.x * ship.dimensions.y;
                playerInfo.maxHealth += shipHealth;
                if (ship.destroyed) return;
                playerInfo.health += (shipHealth - ship.hits.length);
            });
            infos.push(playerInfo);
        });
        return infos;
    };

    public setNextActions = (socket: SocketIO.Socket, actions: Array<BSAction>) : boolean => {
        if (!this.logic.isActionsValid(this.map, actions)) {
            return false;
        }

        this.actions[socket.nickname] = [];

        _utils.forEach(actions, (action: BSAction, index: string) => {
            action.id = socket.nickname + "-action-" + index;
            action.owner = socket.nickname;
            this.actions[socket.nickname].push(action);
        });

        return true;
    };

    public setPlayerReady = (socket: SocketIO.Socket, isReady: boolean) : Game => {
        if (_hasPlayer.call(this, socket) && this.state() === BSData.State.READY) {
            this.players[socket.nickname].isReady = isReady;
            _updateState.call(this);
        }
        return this;
    };

    public placePlayerShips = (socket: SocketIO.Socket, raw_ships: Array<BSShip>) : boolean => {
        let ships = [];
        _utils.forEach(raw_ships, (raw_ship: BSShip) => {
            let ship = new Ship();
            ship.setFromBSShip(raw_ship);
            ships.push(ship);
        });
        if (this.logic.isDispositionValid(this.map, ships)) {
            this.map.setShipDisposition(socket.nickname, ships);

            let allReady = true;
            _utils.forEach(this.players, (player: BSPlayer, nickname: string) => {
                if (_utils.isUndefined(this.map.boards[nickname])) {
                    allReady = false;
                }
            });

            if (allReady) {
                this._state = BSData.State.PLAYING;
            }
            return true;
        }
        return false;
    };

    public acceptPlayer = (socket: SocketIO.Socket, data: BSGameData) : boolean => {
        return _utils.isNull(socket.game) &&
            this.state() === BSData.State.WAITING_PLAYERS &&
            _hasAvailableSlot.call(this) &&
            _passwordIsCorrect.call(this, data) &&
            !_hasPlayer.call(this, socket);
    };

    public summary = () : BSGameSummary => {
        return <BSGameSummary>{
            id: this._id,
            name: this.name,
            players: this.countPlayers(),
            password: _utils.isString(this.password) && this.password.length > 0,
            maxPlayers: this.maxPlayers
        };
    };

    public addPlayer = (socket: SocketIO.Socket) : Game => {
        this.players[socket.nickname] = {
            isReady: false,
            score: 0
        };
        socket.join(this.socketRoomName);
        socket.leave("lobby");
        socket.game = this._id;
        _updateState.call(this);
        return this;
    };

    public removePlayer = (socket: SocketIO.Socket) : Game => {
        socket.join("lobby");
        socket.leave(this.socketRoomName);
        socket.game = null;
        delete this.players[socket.nickname];
        _updateState.call(this);
        return this;
    };

    public removeAllPlayers = (sockets: BSSocketRegistry) : Game => {
        let self = this;
        _utils.forEach(sockets, (socket: SocketIO.Socket) => {
            self.removePlayer(socket);
        });
        return this;
    };

}

/**********************************************************************************/
/*                                                                                */
/*                               PRIVATE MEMBERS                                  */
/*                                                                                */
/**********************************************************************************/

function _updateState(): Game {
    switch (this._state) {
        case BSData.State.WAITING_PLAYERS:
            if (!_hasAvailableSlot.call(this)) {
                this._state = BSData.State.READY;
            }
            break;

        case BSData.State.READY:
            if (_hasAvailableSlot.call(this)) {
                this._state = BSData.State.WAITING_PLAYERS;
            } else if (_areAllPlayersReady.call(this)) {
                this._state = BSData.State.SETTING;
            }
            break;
    }
    return this;
}

function _passwordIsCorrect(data: BSGameData): boolean {
    if (_utils.isString(this.password) && this.password.length) {
        return this.password === data.password;
    }
    return true;
}

function _hasPlayer(socket: SocketIO.Socket): boolean {
    return socket.nickname in this.players;
}

function _hasAvailableSlot(): boolean {
    return this.countPlayers() < this.maxPlayers;
}

function _areAllPlayersReady(): boolean {
    try {
        _utils.forEach(this.players, (player: BSPlayer) => {
            if (!player.isReady) throw new Error();
        });
    } catch (exception) { return false; }
    return true;
}

function _getTurnScores(actions: Array<BSAction>): BSScoreRegistry {
    let scores: BSScoreRegistry = {};

    _utils.forEach(actions, (action: BSAction) => {
        let owner = action.owner;
        if (_utils.isUndefined(scores[owner])) {
            scores[owner] = { score: 0, miss: 0 };
        }

        let missed = true;
        _utils.forEach(action.result, (result: BSTurnResult) => {
            if (result.type === "hit ship") {
                missed = false;
                scores[owner].score += 1;
            }
        });
        scores[owner].miss += missed ? 1 : 0;
    });

    return scores;
}

function _updateBoards(actions: Array<BSAction>): Game {

    _utils.forEach(actions, (action: BSAction) => {
        if (action.result.length === 0) {
            return;
        }

        _utils.forEach(action.result, (result: BSTurnResult) => {
            if (result.type === "hit ship") {
                let owner = result.owner;
                let target = result.target;
                let ship = this.map.boards[owner].ships[target];
                let previousHits = ship.hits;
                let alreadyRegistered = false;

                _utils.forEach(previousHits, (hit: BSCoordinates) => {
                    if (alreadyRegistered || (hit.x === result.localHit.x && hit.y === result.localHit.y)) {
                        alreadyRegistered = true;
                        return;
                    }
                });

                if (!alreadyRegistered) {
                    ship.hits.push(result.localHit);
                    if (ship.hits.length === ship.width * ship.height) {
                        ship.destroyed = true;
                    }
                }
            }
        });
    });

    return this;
}

function _updatePlayersInfos(scores: BSScoreRegistry): Game {
    _utils.forEach(scores, (score: BSScore, owner: string) => {
        this.players[owner].score += score.score;
    });
    return this;
}

export = Game;
